import { MoreHorizontal, X, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import timeAgo from "../../services/timeAgo";

const ConversationItem = ({ conversation, active, onClick, onDelete }) => {
    const other = conversation.other_user;
    const last = conversation.last_message;

    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        try {
            setDeleting(true);

            await onDelete(conversation.id);

            setDeleteModal(false);
            setMenuOpen(false);
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        } finally {
            setDeleting(false);
        }
    };

    const closeModal = () => {
        if (deleting) return;
        setDeleteModal(false);
    };

    const getLastMessagePreview = () => {
        if (!last) return "Say hello 👋";
        if (last.is_deleted) return "Message deleted";

        const content = last.content?.trim();

        let preview = content;

        if (!preview && last.media?.length > 0) {
            const mediaType = last.media[0].media_type;
            preview = `Sent a ${mediaType}.`;

            if (last.media.length > 1) {
                preview += ` (+${last.media.length - 1} more)`;
            }
        }

        if (!preview) preview = "New message";

        return `${last.sender?.username || "You"}: ${preview}`;
    };

    return (
        <>
            <div
                className={`flex relative rounded-lg transition-colors items-center ${
                    active ? "bg-gray-700" : "hover:bg-gray-800"
                }`}
            >
                <button
                    onClick={onClick}
                    className="w-full flex flex-1 min-w-0 items-center gap-3 px-3 py-2.5 text-left"
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
                            {getLastMessagePreview()}
                        </p>
                    </div>
                </button>

                <div className="relative shrink-0 mr-2">
                    <button
                        type="button"
                        aria-label="Conversation options"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((prev) => !prev)}
                        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {menuOpen && (
                        <>
                            <button
                                type="button"
                                aria-label="Close menu"
                                className="fixed inset-0 z-10 cursor-default"
                                onClick={() => setMenuOpen(false)}
                            />

                            <div className="absolute top-full right-0 mt-1 w-40 z-20 rounded-lg bg-gray-800 border border-gray-700 shadow-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setDeleteModal(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                >
                                    <Trash2 size={15} />
                                    Delete chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {deleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") closeModal();
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`delete-title-${conversation.id}`}
                        className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-5 pt-5">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10">
                                    <AlertTriangle
                                        size={20}
                                        className="text-red-400"
                                    />
                                </div>

                                <h2
                                    id={`delete-title-${conversation.id}`}
                                    className="text-lg font-semibold text-white"
                                >
                                    Delete conversation?
                                </h2>
                            </div>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={closeModal}
                                aria-label="Close modal"
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            <p className="text-sm leading-6 text-gray-400">
                                Are you sure you want to delete your
                                conversation with{" "}
                                <span className="font-medium text-gray-200">
                                    {other?.full_name || other?.username}
                                </span>
                                ? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 px-5 pb-5">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={closeModal}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex items-center justify-center gap-2 min-w-24 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
                            >
                                <Trash2 size={15} />
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const ConversationsList = ({
    conversations,
    activeId,
    onSelect,
    onDelete,
    loading,
}) => {
    return (
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {loading ? (
                <div className="space-y-2 px-1 pt-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 animate-pulse"
                        >
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
                        onDelete={onDelete}
                    />
                ))
            )}
        </div>
    );
};

export default ConversationsList;
