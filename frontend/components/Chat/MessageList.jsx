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
  return (
    <div
      ref={containerRef}
      className="
        flex-1
        overflow-y-auto
        px-4
        py-4
        flex
        flex-col
        gap-1.5
      "
    >
      <div
        ref={topSentinelRef}
        className="h-1 shrink-0"
      />

      {loading && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <span className="text-[11px] text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
            Beginning of conversation
          </span>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">
            Start your conversation 👋
          </p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={
            message.sender?.id === currentUserId
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default MessageList;