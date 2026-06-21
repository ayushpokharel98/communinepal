import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

const MessageList = ({
    messages,
    currentUserId,
    containerRef,
    topSentinelRef,
    loading,
    hasMore,
    onEdit,
    onDelete,
}) => {
    const bottomRef = useRef(null);
    const isFirstLoad = useRef(true);

    // auto-scroll to bottom on first load of a conversation, and when a new
    // message is appended while already near the bottom
    useEffect(() => {
        if (!containerRef.current) return;
        if (isFirstLoad.current && messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
            isFirstLoad.current = false;
        }
    }, [messages.length, containerRef]);

    useEffect(() => {
        isFirstLoad.current = true;
    }, [containerRef]);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto py-4 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        >
            <div ref={topSentinelRef} className="h-1 shrink-0" />

            {loading && (
                <div className="flex justify-center py-2">
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
                </div>
            )}

            {!hasMore && messages.length > 0 && (
                <p className="text-center text-[11px] text-gray-600 py-2">
                    You're all caught up
                </p>
            )}

            {messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender?.id === currentUserId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}

            <div ref={bottomRef} />
        </div>
    );
};

export default MessageList;