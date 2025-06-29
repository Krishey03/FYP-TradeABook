import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useSelector } from 'react-redux';
import InitiateChatButton from '@/components/chat/InitiateChatButton';

const ChatInterface = ({ initialChatId }) => {
  const { user } = useSelector((state) => state.auth);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(initialChatId || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const socket = useRef();
  const messagesEndRef = useRef(null);

  // Connect to socket
  useEffect(() => {
    socket.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.current.on('connect', () => {
      console.log('Connected to socket server');
      if (user?._id) {
        // Join user's personal room for new chat notifications
        socket.current.emit('setup', user._id);
      }
    });

    socket.current.on('new_message', (message) => {
      // Only add message if it belongs to the active chat
      if (message.chat._id === activeChat) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    socket.current.on('new_chat', (newChat) => {
      setChats((prevChats) => {
        // Check if chat already exists to avoid duplicates
        if (!prevChats.some(chat => chat._id === newChat._id)) {
          return [newChat, ...prevChats];
        }
        return prevChats;
      });
      
      // If this is the first chat, set it as active
      if (chats.length === 0) {
        setActiveChat(newChat._id);
      }
    });

    socket.current.on('typing', ({ chatId, userName }) => {
      if (chatId === activeChat) {
        setIsTyping(true);
        setTypingUser(`${userName} is typing...`);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket.current.on('stop_typing', ({ chatId }) => {
      if (chatId === activeChat) {
        setIsTyping(false);
      }
    });

    return () => {
      if (socket.current) {
        socket.current.off('new_message');
        socket.current.off('new_chat');
        socket.current.off('typing');
        socket.current.off('stop_typing');
        socket.current.disconnect();
      }
    };
  }, [user?._id, activeChat]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/chat`,
          { withCredentials: true }
        );

        const chats = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.chats)
          ? data.chats
          : [];

        // Filter out any chats with null members
        const validChats = chats.filter(chat => 
          Array.isArray(chat.members) && 
          chat.members.some(member => member && member._id !== user?._id)
        );

        setChats(validChats);

        const validInitialChat = validChats.some((c) => c._id === initialChatId);
        if (initialChatId && validInitialChat) {
          setActiveChat(initialChatId);
        } else if (validChats.length > 0 && !activeChat) {
          setActiveChat(validChats[0]._id);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats. Please try again.');
        setChats([]);
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
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/chat/message/${activeChat}`,
          { withCredentials: true }
        );
        
        // Filter out messages from deleted users
        const validMessages = (data.messages || []).filter(
          message => message.sender && message.sender._id
        );
        
        setMessages(validMessages);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again.');
      }
    };

    if (activeChat) {
      socket.current.emit('join_chat', activeChat);
      fetchMessages();
    }

    return () => {
      if (activeChat && socket.current) {
        socket.current.emit('leave_chat', activeChat);
      }
    };
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/chat/message`,
        {
          content: newMessage,
          chatId: activeChat,
        },
        { withCredentials: true }
      );

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleTyping = () => {
    if (!isTyping && activeChat) {
      setIsTyping(true);
      socket.current.emit('typing', { 
        chatId: activeChat,
        userName: user.userName 
      });
      setTimeout(() => {
        setIsTyping(false);
        socket.current.emit('stop_typing', activeChat);
      }, 3000);
    }
  };

  // Render chat member info safely
  const renderMember = (member) => {
    if (!member) return null;
    
    return (
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
          {member.userName?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium">{member.userName || 'Deleted User'}</p>
          {member._id === user?._id && (
            <p className="text-xs text-gray-500">(You)</p>
          )}
        </div>
      </div>
    );
  };

  // Render message safely
  const renderMessage = (message) => {
    const isCurrentUser = message.sender?._id === user?._id;
    const senderName = message.sender?.userName || 'Deleted User';
    const senderInitial = senderName.charAt(0).toUpperCase();

    return (
      <div
        key={message._id}
        className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isCurrentUser ? 'bg-blue-500 text-white' : 'bg-white border'
          }`}
        >
          {!isCurrentUser && (
            <p className="font-medium text-sm mb-1">{senderName}</p>
          )}
          <p>{message.content}</p>
          <p className={`text-xs mt-1 ${
            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-80px)] border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Chats</h2>
          <InitiateChatButton />
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <p className="text-gray-500 mb-4">You don't have any chats yet</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {chats.map((chat) => (
              <div
                key={chat._id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                  activeChat === chat._id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setActiveChat(chat._id)}
              >
                {chat.members
                  .filter(member => member && member._id !== user?._id)
                  .map(renderMember)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message area */}
      <div className="w-2/3 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b flex items-center">
              {chats
                .find((c) => c._id === activeChat)
                ?.members
                .filter(member => member && member._id !== user?._id)
                .map(member => (
                  <div key={member._id}>
                    {renderMember(member)}
                  </div>
                ))}
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                messages.map(renderMessage)
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border px-4 py-2 rounded-lg">
                    <p className="text-gray-500 italic">{typingUser}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!activeChat}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition disabled:bg-gray-400"
                  disabled={!activeChat || !newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;