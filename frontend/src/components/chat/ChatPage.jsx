import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from "@/pages/chat/ChatInterface";
import { useChat } from './ChatContext';
import { Link } from 'react-router-dom';
import { Search, MoreVertical } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import ShoppingHeader from "@/pages/shopping-view/header";

export default function ChatPage() {
    const { chatId } = useParams();
    const { isLoading, chats } = useChat();
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Filter chats to show only other members
    const filteredChats = useMemo(() => {
        const userId = user?._id || user?.id;
        if (!userId) return [];
        
        return chats.filter(
            (chat) => Array.isArray(chat.members) && chat.members.some((member) => member && String(member._id) !== String(userId)),
        );
    }, [chats, user?._id, user?.id]);

    const handleChatSelect = (chatId) => {
        navigate(`/chat/${chatId}`);
    };

    const getOtherMember = (chat) => {
        const userId = user?._id || user?.id;
        return chat.members.find((member) => member && String(member._id) !== String(userId));
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Only show loading if we have no chats and are loading
    if (isLoading && chats.length === 0) {
        return <div>Loading chats...</div>;
    }
    
    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Use the same header as shopping site */}
            <ShoppingHeader />

            {/* Main Chat Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Column - Messages List */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                    {/* Messages Header */}
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Messages</h2>
                        
                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search...."
                                className="w-full px-4 py-2 pl-10 pr-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredChats.length === 0 ? (
                            <div className="flex items-center justify-center h-full p-4">
                                <div className="text-center">
                                    <p className="text-gray-500 text-sm">No conversations yet</p>
                                    <p className="text-gray-400 text-xs mt-1">Start a new chat to begin messaging</p>
                                </div>
                            </div>
                        ) : (
                            filteredChats.map((chat) => {
                                const otherMember = getOtherMember(chat);
                                return (
                                    <div 
                                        key={chat._id} 
                                        className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                                            chatId === chat._id ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => handleChatSelect(chat._id)}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                                            {otherMember?.userName?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {otherMember?.userName || "Unknown User"}
                                            </p>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatTime(chat.updatedAt)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column - Chat Window */}
                <div className="flex-1 flex flex-col">
                    <ChatInterface initialChatId={chatId} />
                </div>
            </div>
        </div>
    );
}