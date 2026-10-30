import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import ClickableMedia from "../ClickableMedia";

const MessageBubble = ({ message, isOwn, onEdit, onDelete, onReply }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const renderReplyButton = () => (
        <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            title="Reply"
            aria-label="Reply to message"
        >
            <Reply size={16} />
        </button>
    );

    return (
        <div
            className={`group flex items-center gap-2 ${isOwn ? "justify-end" : "justify-start"
                } px-3`}
        >
            {!isOwn && (
                <div className={`flex ${message.parent ? "items-end": "items-center"} h-full`}>
                    <img
                        src={message.sender.profile_picture}
                        alt={message.sender.username}
                        className="w-8 h-8 rounded-full object-cover bg-gray-700 shrink-0"
                    />
                </div>
            )}

            {isOwn && (
                <div className="relative flex items-center gap-1" ref={menuRef}>
                    {!message.is_deleted && (
                        <>
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className={`p-1.5 rounded-full hover:bg-gray-800 text-gray-500 transition-opacity ${menuOpen
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-100"
                                    }`}
                                title="More options"
                                aria-label="More message options"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                            {renderReplyButton()}
                        </>
                    )}

                    {menuOpen && !message.is_deleted && (
                        <div className="absolute bottom-full right-0 mb-1 w-36 rounded-lg bg-gray-800 border border-gray-700 shadow-lg overflow-hidden z-50">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEdit(message);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>

                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDelete(message);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col max-w-[75%] sm:max-w-[60%] min-w-0">
                {message.parent && (
                    <div
                        className={`mb-1 px-3 py-2 rounded-xl bg-gray-700/60 italic`}
                    >
                        <p className="text-[11px] font-semibold text-gray-300 mb-0.5">
                            {isOwn ? "You replied" : "You were replied to"}
                        </p>
                        {
                            message.parent.content && (
                                <p className="text-xs text-gray-300 line-clamp-1 whitespace-pre-wrap wrap-break-word">
                                    {message.parent.content}
                                </p>
                            )
                        }
                        {
                            message.parent.media.length > 0 && (
                                <ClickableMedia file={message.parent.media[0]} size={"sm"}/>
                            )
                        }
                    </div>
                )}

                <div
                    className={`rounded-2xl px-3.5 py-2 ${isOwn
                            ? "bg-blue-600/80 text-gray-100 rounded-br-md"
                            : "bg-gray-800 text-gray-100 rounded-bl-md"
                        }`}
                >
                    {message.is_deleted ? (
                        <p className="text-sm italic text-gray-500">
                            Message deleted
                        </p>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap wrap-break-word">
                            {message.content}
                        </p>
                    )}

                    {!message.is_deleted && message.media?.length > 0 && (
                        <div
                            className={`grid ${message.media.length === 1
                                    ? "grid-cols-1"
                                    : message.media.length < 5
                                        ? "grid-cols-2"
                                        : "grid-cols-3"
                                } gap-2`}
                        >
                            {message.media.map((file) => (
                                <ClickableMedia key={file.id} file={file} />
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-1 justify-end mt-0.5">
                        {message.is_edited && !message.is_deleted && (
                            <span className="text-[10px] text-gray-500">
                                edited
                            </span>
                        )}
                        <span className="text-[10px] text-gray-500">
                            {time}
                        </span>
                    </div>
                </div>
            </div>

            {!isOwn && !message.is_deleted && (
                <div className="flex items-center">
                    {renderReplyButton()}
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
