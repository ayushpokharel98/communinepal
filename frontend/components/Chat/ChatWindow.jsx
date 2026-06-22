import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import chatService from "../../services/chatService";
import useInfiniteMessages from "../../services/useInfiniteMessages";

export const EmptyChatState = () => (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-600 gap-3">
        <div className="w-16 h-16 rounded-full border-2 border-gray-700 flex items-center justify-center">
            <MessageCircle size={28} />
        </div>
        <p className="text-sm text-gray-500">Select a conversation to start chatting</p>
    </div>
);

const ChatWindow = ({ conversation, currentUserId, onBack, setConversations }) => {
    const {
        messages,
        loading,
        hasMore,
        containerRef,
        topSentinelRef,
        addMessage,
        updateMessage,
    } = useInfiniteMessages(conversation.id);

    const [editingMessage, setEditingMessage] = useState(null);

    const handleSend = async (content) => {
        try {
            if (conversation.optimistic) {
                const newConversation = await chatService.createConversation(conversation.other_user.username);
                setConversations((prev) => [newConversation, ...prev]);
                const message = await chatService.sendMessage(newConversation.id, { content });
            } else {
                const message = await chatService.sendMessage(conversation.id, { content });
            }
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const handleSubmitEdit = async (messageId, content) => {
        try {
            const updated = await chatService.editMessage(messageId, content);
            updateMessage(messageId, { content: updated.content, is_edited: true });
        } catch (err) {
            console.error("Failed to edit message", err);
        } finally {
            setEditingMessage(null);
        }
    };

    const handleDelete = async (message) => {
        const previous = message;
        updateMessage(message.id, { is_deleted: true, content: "" });
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
                onCancelEdit={() => setEditingMessagetingMessage(null)}
                onSubmitEdit={handleSubmitEdit}
            />
        </div>
    );
};

export default ChatWindow;