import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import axios from "axios"
import { useSelector } from "react-redux"
import { Send, User, MoreVertical } from "lucide-react"
import InitiateChatButton from "@/components/chat/InitiateChatButton"
import { useChat } from "@/components/chat/ChatContext"
import { useLocation, useNavigate } from "react-router-dom"

const ChatInterface = ({ initialChatId }) => {
  const { user, isAuthLoading } = useSelector((state) => state.auth)
  const { chats, isLoading: contextIsLoading, fetchChats, socket: contextSocket, deleteChat } = useChat()
  const [activeChat, setActiveChat] = useState(initialChatId || null)
  const location = useLocation()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState("")
  const [error, setError] = useState(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Add beforeunload listener to debug reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      console.log("Page is about to unload/reload", e)
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Track location changes
  useEffect(() => {
    // Location changed - this is normal React Router behavior
  }, [location])

  // Improved scroll function with useCallback
  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior,
            block: "nearest",
            inline: "start",
          })
        }
      }, 100)
    }
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = messagesContainerRef.current
      const isNearBottom = scrollHeight - (clientHeight + scrollTop) < 100

      if (isNearBottom) {
        scrollToBottom()
      }
    }
  }, [messages, scrollToBottom])

  // Use socket from context
  useEffect(() => {
    if (!contextSocket) {
      return;
    }

    const handleConnect = () => {
      console.log("Connected to socket server")
      setIsSocketConnected(true)
      if (user?._id) {
        console.log("Emitting setup with user ID:", user._id)
        contextSocket.emit("setup", user._id)
      }
    }

    const handleDisconnect = () => {
      setIsSocketConnected(false)
    }

    const handleNewMessage = (message) => {
      if (message.chat._id === activeChat) {
        setMessages((prev) => {
          // Remove any optimistic messages for this chat
          const filteredMessages = prev.filter(msg => !msg.isOptimistic)
          return [...filteredMessages, message]
        })
      }
    }

    const handleNewChat = (newChat) => {
      if (chats.length === 0) {
        setActiveChat(newChat._id)
      }
    }

    const handleTyping = ({ chatId, userName }) => {
      if (chatId === activeChat) {
        setIsTyping(true)
        setTypingUser(`${userName} is typing...`)
        setTimeout(() => setIsTyping(false), 3000)
      }
    }

    const handleStopTyping = ({ chatId }) => {
      if (chatId === activeChat) {
        setIsTyping(false)
      }
    }

    contextSocket.on("connect", handleConnect)
    contextSocket.on("disconnect", handleDisconnect)
    contextSocket.on("new_message", handleNewMessage)
    contextSocket.on("new_chat", handleNewChat)
    contextSocket.on("typing", handleTyping)
    contextSocket.on("stop_typing", handleStopTyping)

    return () => {
      contextSocket.off("connect", handleConnect)
      contextSocket.off("disconnect", handleDisconnect)
      contextSocket.off("new_message", handleNewMessage)
      contextSocket.off("new_chat", handleNewChat)
      contextSocket.off("typing", handleTyping)
      contextSocket.off("stop_typing", handleStopTyping)
    }
  }, [contextSocket, user?._id, activeChat, chats.length])

  // Memoize filtered chats to prevent unnecessary re-renders
  const filteredChats = useMemo(() => {
    const userId = user?._id || user?.id;
    if (!userId || isAuthLoading) return [];
    
    return chats.filter(
      (chat) => Array.isArray(chat.members) && chat.members.some((member) => member && String(member._id) !== String(userId)),
    );
  }, [chats, user?._id, user?.id, isAuthLoading]);

  // Use chats from context and set active chat
  useEffect(() => {
    if (!filteredChats.length) {
      return;
    }
    
    const validInitialChat = filteredChats.some((c) => c._id === initialChatId)
    const currentActiveChatIsValid = activeChat && filteredChats.some(c => c._id === activeChat)
    
    // Only set activeChat if it's actually needed
    if (initialChatId && validInitialChat && activeChat !== initialChatId) {
      setActiveChat(initialChatId)
    } else if (filteredChats.length > 0 && !currentActiveChatIsValid) {
      setActiveChat(filteredChats[0]._id)
    }
  }, [filteredChats, initialChatId, activeChat])

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) {
        return;
      }
      
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/chat/message/${activeChat}`, {
          withCredentials: true,
        })

        const validMessages = (data.messages || []).filter((message) => message.sender && message.sender._id)
        setMessages(validMessages)
        scrollToBottom("auto")
      } catch (error) {
        console.error("Error fetching messages:", error)
        setError("Failed to load messages. Please try again.")
      }
    }

    if (activeChat) {
      // Always fetch messages when activeChat changes, regardless of socket connection
      fetchMessages()
      
      // Join chat via socket if available
      if (contextSocket) {
        contextSocket.emit("join_chat", activeChat)
      }
    }

    return () => {
      if (activeChat && contextSocket) {
        contextSocket.emit("leave_chat", activeChat)
      }
    }
  }, [activeChat, scrollToBottom, contextSocket])

  const handleSendMessage = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!newMessage.trim() || !activeChat) return

    // Optimistic update - immediately add message to UI
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      content: newMessage,
      sender: { _id: user?._id || user?.id, userName: user?.userName },
      chat: { _id: activeChat },
      createdAt: new Date().toISOString(),
      isOptimistic: true // Flag to identify optimistic messages
    }

    // Immediately add to messages and clear input
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage("")
    scrollToBottom()

    // Send API call in background
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/chat/message`,
        {
          content: newMessage,
          chatId: activeChat,
        },
        { withCredentials: true },
      )
      // Remove optimistic message when real message arrives via socket
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id))
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id))
    }
  }

  const handleTyping = () => {
    if (!isTyping && activeChat && contextSocket) {
      setIsTyping(true)
      contextSocket.emit("typing", {
        chatId: activeChat,
        userName: user?.userName,
      })
      setTimeout(() => {
        setIsTyping(false)
        contextSocket.emit("stop_typing", activeChat)
      }, 3000)
    }
  }

  const handleDeleteChat = async () => {
    if (!activeChat) return;
    
    setIsDeleting(true);
    try {
      await deleteChat(activeChat);
      setShowDeleteConfirm(false);
      setShowDropdown(false);
      setActiveChat(null);
      navigate('/chat');
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMessage = (message) => {
    const userId = user?._id || user?.id;
    const isCurrentUser = String(message.sender?._id) === String(userId)
    const senderName = message.sender?.userName || "Deleted User"
    const isOptimistic = message.isOptimistic

    if (isCurrentUser) {
      // Outgoing message - avatar on the right
      return (
        <div key={message._id} className="flex mb-4 justify-end">
          <div className="flex max-w-[70%] items-end">
            <div
              className={`px-4 py-2 rounded-2xl ${
                isOptimistic 
                  ? "bg-blue-400 text-white rounded-br-md opacity-75"
                  : "bg-blue-500 text-white rounded-br-md"
              }`}
            >
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium ml-3 flex-shrink-0 mt-1">
              {user?.userName?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>
      )
    } else {
      // Incoming message - avatar on the left
      return (
        <div key={message._id} className="flex mb-4 justify-start">
          <div className="flex max-w-[70%] items-end">
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0 mt-1">
              {senderName.charAt(0).toUpperCase()}
            </div>
            <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-bl-md px-4 py-2">
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            </div>
          </div>
        </div>
      )
    }
  }

  // Get the other member for the active chat
  const getOtherMember = () => {
    if (!activeChat) return null;
    const activeChatData = chats.find((c) => c._id === activeChat);
    if (!activeChatData) return null;
    
    const userId = user?._id || user?.id;
    return activeChatData.members.find((member) => member && String(member._id) !== String(userId));
  };

  return (
    <div className="flex flex-col h-full">
      {activeChat ? (
        <>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {(() => {
                const otherMember = getOtherMember();
                return (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-medium">
                      {otherMember?.userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {otherMember?.userName || "Unknown User"}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            
            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowDropdown(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Delete chat
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto bg-gray-50 p-4"
            ref={messagesContainerRef}
          >
            {messages.length > 0 ? (
              messages.map(renderMessage)
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Send a message to start the conversation</p>
                </div>
              </div>
            )}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 px-4 py-2 rounded-2xl rounded-bl-md">
                  <p className="text-gray-500 text-sm italic">{typingUser}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSendMessage(e)
                  }
                }}
                placeholder="Type a message...."
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!activeChat}
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSendMessage(e)
                }}
                disabled={!activeChat || !newMessage.trim()}
                className="w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Chat</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this chat? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteChat}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Send className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500 text-sm">Choose a chat from the sidebar to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface