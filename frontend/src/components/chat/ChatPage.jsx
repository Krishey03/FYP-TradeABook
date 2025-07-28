import { useParams } from 'react-router-dom';
import ChatInterface from "@/pages/chat/ChatInterface";
import { useChat } from './ChatContext';

export default function ChatPage() {
    const { chatId } = useParams();
    const { isLoading, chats } = useChat();

    // Only show loading if we have no chats and are loading
    if (isLoading && chats.length === 0) {
        return <div>Loading chats...</div>;
      }
    
    return (
        <div className="container mx-auto px-4 py-6">
            <div className="text-2xl font-bold mb-2"></div>
            <ChatInterface initialChatId={chatId} />
        </div>
    );
}