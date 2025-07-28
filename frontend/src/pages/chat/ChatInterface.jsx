import { useState, useEffect, useRef, useCallback } from "react"
import { io } from "socket.io-client"
import axios from "axios"
import { useSelector } from "react-redux"
import { Send, User } from "lucide-react"
import InitiateChatButton from "@/components/chat/InitiateChatButton"
import PropTypes from 'prop-types';

const ChatInterface = ({ initialChatId }) => {
  const { user } = useSelector((state) => state.auth)
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(initialChatId || null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const socket = useRef()
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);


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

  // Connect to socket
  useEffect(() => {
    socket.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    })

    socket.current.on("connect", () => {
      console.log("Connected to socket server")
      if (user?._id) {
        socket.current.emit("setup", user._id)
      }
    })

    socket.current.on("new_message", (message) => {
      if (message.chat._id === activeChat) {
        setMessages((prev) => [...prev, message])
      }
    })

    socket.current.on("new_chat", (newChat) => {
      setChats((prevChats) => {
        if (!prevChats.some((chat) => chat._id === newChat._id)) {
          return [newChat, ...prevChats]
        }
        return prevChats
      })

      if (chats.length === 0) {
        setActiveChat(newChat._id)
      }
    })

    socket.current.on("typing", ({ chatId, userName }) => {
      if (chatId === activeChat) {
        setIsTyping(true)
        setTypingUser(`${userName} is typing...`)
        setTimeout(() => setIsTyping(false), 3000)
      }
    })

    socket.current.on("stop_typing", ({ chatId }) => {
      if (chatId === activeChat) {
        setIsTyping(false)
      }
    })

    return () => {
      if (socket.current) {
        socket.current.off("new_message")
        socket.current.off("new_chat")
        socket.current.off("typing")
        socket.current.off("stop_typing")
        socket.current.disconnect()
      }
    }
  }, [user?._id, activeChat, chats.length])

  // Fetch chats
useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/chat`, { 
          withCredentials: true 
        });
        
        const chats = Array.isArray(data?.data) ? data.data : Array.isArray(data?.chats) ? data.chats : [];
        const validChats = chats.filter(
          (chat) => Array.isArray(chat.members) && chat.members.some((member) => member && member._id !== user?._id),
        );

        setChats(validChats);
        
        // Set active chat logic
        if (validChats.length > 0) {
          // Priority 1: Use initialChatId if valid
          // Priority 2: Use first chat if no initialChatId
          const chatToSet = validChats.find(c => c._id === initialChatId) || validChats[0];
          setActiveChat(chatToSet._id);
        }
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError("Failed to load chats. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id) {
      fetchChats();
    }
  }, [user?._id, initialChatId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
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
      socket.current.emit("join_chat", activeChat)
      fetchMessages()
    }

    return () => {
      if (activeChat && socket.current) {
        socket.current.emit("leave_chat", activeChat)
      }
    }
  }, [activeChat, scrollToBottom])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/chat/message`,
        {
          content: newMessage,
          chatId: activeChat,
        },
        { withCredentials: true },
      )
      setNewMessage("")
      scrollToBottom()
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
    }
  }

  const handleTyping = () => {
    if (!isTyping && activeChat) {
      setIsTyping(true)
      socket.current.emit("typing", {
        chatId: activeChat,
        userName: user.userName,
      })
      setTimeout(() => {
        setIsTyping(false)
        socket.current.emit("stop_typing", activeChat)
      }, 3000)
    }
  }

  const renderMember = (member) => {
    if (!member) return null

      if (!initialLoadComplete){    return (
        
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {member.userName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{member.userName || "Deleted User"}</p>
          {member._id === user?._id && <p className="text-xs text-gray-500">(You)</p>}
        </div>
      </div>
    )}
  }

  const renderMessage = (message) => {
    const isCurrentUser = message.sender?._id === user?._id
    const senderName = message.sender?.userName || "Deleted User"

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
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-md"
            }`}
          >
            {!isCurrentUser && <p className="font-medium text-xs sm:text-sm mb-1 text-gray-600">{senderName}</p>}
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
            <p className={`text-xs mt-1 ${isCurrentUser ? "text-blue-100" : "text-gray-400"}`}>
              {new Date(message.createdAt).toLocaleTimeString([], {
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
    <div className="flex h-[calc(100vh-80px)] bg-white relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 mx-4 sm:mx-6" />

        {isLoading ? (
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
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <p className="text-gray-400 text-xs mt-1">Start a new chat to begin messaging</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-2 sm:px-3">
            {chats.map((chat) => (
              <div
                key={chat._id}
                className={`p-3 mx-2 sm:mx-3 mb-1 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeChat === chat._id ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"
                }`}
                onClick={() => {
                  setActiveChat(chat._id)
                  setIsMobileSidebarOpen(false) // Close sidebar on mobile when chat is selected
                }}
              >
                {chat.members.filter((member) => member && member._id !== user?._id).map(renderMember)}
              </div>
            ))}
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
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                {chats
                  .find((c) => c._id === activeChat)
                  ?.members.filter((member) => member && member._id !== user?._id)
                  .map((member) => (
                    <div key={member._id}>{renderMember(member)}</div>
                  ))}
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto bg-gray-50/30 relative"
              ref={messagesContainerRef}
            >
              <div className="p-3 sm:p-4 lg:p-6 pb-16"> {/* Added pb-16 for padding at the bottom */}
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
              <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm min-w-0"
                  disabled={!activeChat}
                />
                <button
                  type="submit"
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                  disabled={!activeChat || !newMessage.trim()}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
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

ChatInterface.propTypes = {
  initialChatId: PropTypes.string
};

export default ChatInterface