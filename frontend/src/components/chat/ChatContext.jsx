import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import api from '@/api/axios';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const ChatContext = createContext();

const useChat = () => {
  return useContext(ChatContext);
};

const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const socket = useRef(null);

  // ✅ Memoized fetchChats to prevent infinite loop
  const fetchChats = useCallback(async () => {
    if (!isInitialized) {
      setIsLoading(true);
    }
    try {
      const { data } = await api.get('/chat');
      const chats = Array.isArray(data?.data) ? data.data : [];
      setChats(chats);

      const count = chats.reduce((acc, chat) => {
        if (chat.lastMessage && !chat.lastMessage.readBy?.includes(user?._id)) {
          return acc + 1;
        }
        return acc;
      }, 0);
      setUnreadCount(count);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]); // fallback
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, isInitialized]);

  const initiateChat = async (email) => {
    try {
      const { data } = await api.post('/chat/initiate', { email });
      setChats((prev) => [data.chat, ...prev]);
      return data.chat;
    } catch (error) {
      console.error('Error initiating chat:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    if (!socket.current) {
      socket.current = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket']
      });
    }

    // Socket event handlers
    const handleNewMessage = (message) => {
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat._id === message.chat._id) {
            return {
              ...chat,
              lastMessage: message
            };
          }
          return chat;
        });
      });
    };

    const handleNewChat = (newChat) => {
      setChats((prevChats) => [newChat, ...prevChats]);
    };

    // Set up socket event listeners
    socket.current.on('new_message', handleNewMessage);
    socket.current.on('new_chat', handleNewChat);

    fetchChats();

    return () => {
      if (socket.current) {
        socket.current.off('new_message', handleNewMessage);
        socket.current.off('new_chat', handleNewChat);
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [user?._id, fetchChats]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        unreadCount,
        isLoading,
        fetchChats,
        initiateChat,
        socket: socket.current
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { ChatProvider, useChat };
