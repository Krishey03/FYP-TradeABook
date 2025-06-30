// src/hooks/useMessageDropdown.js
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/components/chat/ChatContext";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

export default function useMessageDropdown() {
  const { user } = useSelector((state) => state.auth);
  const { chats, unreadCount, fetchChats } = useChat();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const socket = useRef();

  useEffect(() => {
    // Initialize socket connection
    socket.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ['websocket']
    });

    // Listen for new messages
    socket.current.on('new_message', () => {
      fetchChats(); // Refresh chat list when new message arrives
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const loadChats = async () => {
      setIsLoading(true);
      try {
        await fetchChats();
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [fetchChats]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleViewAll = () => {
    navigate('/chat');
  };

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  // Get only the 5 most recent chats, sorted by last message time
  const recentChats = chats
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime) - new Date(aTime);
    })
    .slice(0, 5);

  return {
    isLoading,
    recentChats,
    unreadCount,
    user,
    formatTime,
    handleViewAll,
    handleChatClick
  };
}