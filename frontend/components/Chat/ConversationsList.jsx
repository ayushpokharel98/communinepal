import timeAgo from "../../services/timeAgo";

const ConversationItem = ({ conversation, active, onClick }) => {    
    const other = conversation.other_user;
    const last = conversation.last_message;    
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                active ? "bg-gray-700" : "hover:bg-gray-800"
            }`}
        >
            <img
                src={other?.profile_picture}
                alt={other?.username}
                className="w-12 h-12 rounded-full object-cover bg-gray-700 shrink-0"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-100 truncate">
                        {other?.full_name || other?.username}
                    </span>
                    {last && (
                        <span className="text-[11px] text-gray-500 shrink-0">
                            {timeAgo(last.created_at)}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                    {last
                        ? last.is_deleted
                            ? "Message deleted"
                            : `${last.sender.username}: ${last.content}`
                        : "Say hello \uD83D\uDC4B"}
                </p>
            </div>
        </button>
    );
};

const ConversationsList = ({ conversations, activeId, onSelect, loading }) => {
    return (
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {loading ? (
                <div className="space-y-2 px-1 pt-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-gray-700" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-2.5 w-2/3 rounded bg-gray-700" />
                                <div className="h-2 w-1/2 rounded bg-gray-800" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : conversations.length === 0 ? (
                <p className="text-xs text-gray-500 px-2 py-4 text-center">
                    No conversations yet. Pick a friend above to start chatting.
                </p>
            ) : (
                conversations.map((conv) => (
                    <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        active={conv.id === activeId}
                        onClick={() => onSelect(conv)}
                    />
                ))
            )}
        </div>
    );
};

export default ConversationsList;