import { useState, useEffect, useRef } from "react";
import { Send, X, ImagePlus } from "lucide-react";

const MessageInput = ({ onSend, editingMessage, onCancelEdit, onSubmitEdit }) => {
    const [text, setText] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.content);
            inputRef.current?.focus();
        }
    }, [editingMessage]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;

        if (editingMessage) {
            onSubmitEdit(editingMessage.id, trimmed);
        } else {
            onSend(trimmed);
        }
        setText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape" && editingMessage) {
            onCancelEdit();
            setText("");
        }
    };

    return (
        <div className="shrink-0 bg-gray-900 border-t border-gray-800">
            {editingMessage && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800/60 text-xs text-gray-400">
                    <span>Editing message</span>
                    <button
                        onClick={() => {
                            onCancelEdit();
                            setText("");
                        }}
                        className="p-1 rounded-full hover:bg-gray-700 text-gray-400"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3">
                <button
                    type="button"
                    className="p-2 rounded-full hover:bg-gray-800 text-gray-400 transition-colors shrink-0"
                    title="Attach image"
                >
                    <ImagePlus size={20} />
                </button>
                <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 text-sm rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-gray-600"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="p-2.5 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-gray-700 text-gray-100 transition-colors shrink-0"
                >
                    <Send size={17} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;