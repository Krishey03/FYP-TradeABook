import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import axios from "axios"
import { useSelector } from "react-redux"
import { Send, User } from "lucide-react"
import InitiateChatButton from "@/components/chat/InitiateChatButton"
import { useChat } from "@/components/chat/ChatContext"
import { useLocation } from "react-router-dom"

const ChatInterface = ({ initialChatId }) => {
  const { user, isAuthLoading } = useSelector((state) => state.auth)
  const { chats, isLoading: contextIsLoading, fetchChats, socket: contextSocket } = useChat()
  const [activeChat, setActiveChat] = useState(initialChatId || null)
  const location = useLocation()
  

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState("")
  const [error, setError] = useState(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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
        messagesEndRef.current.scrollIntoView({
          behavior,
          block: "nearest",
          inline: "start",
        })
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
    if (!contextSocket) return

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
    if (!filteredChats.length) return;
    
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
      if (!activeChat) return;
      
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
  }, [activeChat, scrollToBottom])

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

  const renderMember = (member) => {
    if (!member) return null

    const userId = user?._id || user?.id;
    const isCurrentUser = String(member._id) === String(userId);

    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {member.userName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{member.userName || "Deleted User"}</p>
          {isCurrentUser && <p className="text-xs text-gray-500">(You)</p>}
        </div>
      </div>
    )
  }

  const renderMessage = (message) => {
    const userId = user?._id || user?.id;
    const isCurrentUser = String(message.sender?._id) === String(userId)
    const senderName = message.sender?.userName || "Deleted User"
    const isOptimistic = message.isOptimistic

    return (
      <div key={message._id} className={`flex mb-3 sm:mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
        >
          {!isCurrentUser && (
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs sm:text-sm font-medium mr-2 sm:mr-3 flex-shrink-0 mt-1">
              {senderName.charAt(0).toUpperCase()}
            </div>
          )}
          <div
            className={`px-3 sm:px-4 py-2 rounded-2xl ${
              isCurrentUser
                ? isOptimistic 
                  ? "bg-blue-400 text-white rounded-br-md opacity-75" // Slightly transparent for optimistic messages
                  : "bg-blue-500 text-white rounded-br-md"
                : "bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-md"
            }`}
          >
            {!isCurrentUser && <p className="font-medium text-xs sm:text-sm mb-1 text-gray-600">{senderName}</p>}
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
            <p className={`text-xs mt-1 ${isCurrentUser ? "text-blue-100" : "text-gray-400"}`}>
              {isOptimistic ? "Sending..." : new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div key={`${user?._id}-${chats.length}`} className="flex h-[calc(100vh-80px)] bg-white relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-white z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 fixed lg:relative z-50 lg:z-auto
          w-80 sm:w-96 lg:w-80 xl:w-96 bg-gray-50/50 flex flex-col
          transition-transform duration-300 ease-in-out
          h-full lg:h-auto
        `}
      >
        <div className="p-4 sm:p-6 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center gap-2">
            <InitiateChatButton />
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 mx-4 sm:mx-6" />

        {isAuthLoading || contextIsLoading || !(user?._id || user?.id) ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <p className="text-gray-400 text-xs mt-1">Start a new chat to begin messaging</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-2 sm:px-3">
            {filteredChats.map((chat) => {
              const otherMember = chat.members.find((member) => member && String(member._id) !== String(user?._id || user?.id));
              return (
                <div
                  key={chat._id}
                  className={`p-3 mx-2 sm:mx-3 mb-1 rounded-xl cursor-pointer transition-all duration-200 ${
                    activeChat === chat._id ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveChat(chat._id)
                    setIsMobileSidebarOpen(false)
                  }}
                >
                  {otherMember && renderMember(otherMember)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider - Hidden on mobile */}
      <div className="hidden lg:block w-px bg-gray-200" />

      {/* Message area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 sm:p-6 bg-white flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                {(() => {
                  const activeChatData = filteredChats.find((c) => c._id === activeChat);
                  const otherMember = activeChatData?.members.find((member) => member && String(member._id) !== String(user?._id || user?.id));
                  return otherMember ? <div key={otherMember._id}>{renderMember(otherMember)}</div> : null;
                })()}
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto bg-gray-50/30 relative"
              ref={messagesContainerRef}
            >
              <div className="p-3 sm:p-4 lg:p-6 pb-16">
                {messages.length > 0 ? (
                  messages.map(renderMessage)
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center px-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Send className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No messages yet</p>
                      <p className="text-gray-400 text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                  </div>
                )}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white shadow-sm border border-gray-100 px-3 sm:px-4 py-2 rounded-2xl rounded-bl-md">
                      <p className="text-gray-500 text-sm italic">{typingUser}</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input - Fixed at the bottom */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 lg:p-6">
              <div 
                className="flex gap-2 sm:gap-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    console.log("Container onKeyDown - Enter pressed")
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
              >
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
                  placeholder="Type a message..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm min-w-0"
                  disabled={!activeChat}
                />
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSendMessage(e)
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{ pointerEvents: !activeChat || !newMessage.trim() ? 'none' : 'auto' }}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50/30">
            <div className="text-center px-4">
              {/* Mobile: Show button to open sidebar if no chats selected */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  View Conversations
                </button>
              </div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Send className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500 text-sm">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface