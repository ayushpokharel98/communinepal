import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const MessageBubble = ({ message, isOwn, onEdit, onDelete }) => {
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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className={`group flex items-center align-middle gap-2 ${isOwn ? "justify-end" : "justify-start"} px-3`}>
            {
                !isOwn && (
                <img
                src={message.sender.profile_picture}
                alt={message.sender.username}
                className="w-8 h-8 rounded-full object-cover bg-gray-700 shrink-0"
            />
                )
            }
            {(isOwn) && (
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className={`p-1.5 rounded-full hover:bg-gray-800 text-gray-500 transition-opacity ${
                            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                    >
                        {
                            !message.is_deleted && (
                                <MoreHorizontal size={16} />
                            )
                        }
                    </button>

                    {menuOpen && (
                        <div className="absolute bottom-full right-0 mb-1 w-36 rounded-lg bg-gray-800 border border-gray-700 shadow-lg overflow-hidden z-50">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEdit(message);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                            >
                                <Pencil size={14} /> Edit
                            </button>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDelete(message);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div
                className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-3.5 py-2 ${
                    isOwn
                        ? "bg-blue-600/80 text-gray-100 rounded-br-md"
                        : "bg-gray-800 text-gray-100 rounded-bl-md"
                }`}
            >
                {message.is_deleted ? (
                    <p className="text-sm italic text-gray-500">Message deleted</p>
                ) : (
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.content}</p>
                )}
                <div className="flex items-center gap-1 justify-end mt-0.5">
                    {message.is_edited && !message.is_deleted && (
                        <span className="text-[10px] text-gray-500">edited</span>
                    )}
                    <span className="text-[10px] text-gray-500">{time}</span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;