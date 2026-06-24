import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import chatService from "../../services/chatService";
import useInfiniteMessages from "../../services/useInfiniteMessages";
import { useAuth } from "../../contexts/AuthContext";

export const EmptyChatState = () => (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-600 gap-3">
        <div className="w-16 h-16 rounded-full border-2 border-gray-700 flex items-center justify-center">
            <MessageCircle size={28} />
        </div>
        <p className="text-sm text-gray-500">Select a conversation to start chatting</p>
    </div>
);

const ChatWindow = ({ conversation, currentUserId, onBack, setConversations, setActiveConversation }) => {
    const {
        messages,
        loading,
        hasMore,
        containerRef,
        topSentinelRef,
        addMessage,
        updateMessage,
    } = useInfiniteMessages(conversation, setConversations);

    const [editingMessage, setEditingMessage] = useState(null);
    const { user } = useAuth();

    const handleSend = async (content) => {
        try {
            let currentConversation = conversation;
            if (conversation.optimistic) {
                currentConversation = await chatService.createConversation(
                    conversation.other_user.username
                );
                setConversations((prev) => [
                    currentConversation,
                    ...prev.filter((c) => c.id !== conversation.id),
                ]);
                setActiveConversation(currentConversation);
            }
            const message = await chatService.sendMessage(
                currentConversation.id,
                { content }
            );
            setConversations((prev) => prev.map((c) => c.id === currentConversation.id ? { ...c, last_event: message } : c));
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const handleSubmitEdit = async (messageId, content) => {
        try {
            const updated = await chatService.editMessage(messageId, content);
        } catch (err) {
            console.error("Failed to edit message", err);
        } finally {
            setEditingMessage(null);
        }
    };

    const handleDelete = async (message) => {
        const previous = message;
        try {
            await chatService.deleteMessage(message.id);
        } catch (err) {
            console.error("Failed to delete message", err);
            updateMessage(message.id, previous);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-60px)] bg-gray-900 min-w-0">
            <ChatHeader otherUser={conversation.other_user} onBack={onBack} />

            <MessageList
                messages={messages}
                currentUserId={currentUserId}
                containerRef={containerRef}
                topSentinelRef={topSentinelRef}
                loading={loading}
                hasMore={hasMore}
                onEdit={(message) => setEditingMessage(message)}
                onDelete={handleDelete}
            />

            <MessageInput
                onSend={handleSend}
                editingMessage={editingMessage}
                onCancelEdit={() => setEditingMessage(null)}
                onSubmitEdit={handleSubmitEdit}
            />
        </div>
    );
};

export default ChatWindow;