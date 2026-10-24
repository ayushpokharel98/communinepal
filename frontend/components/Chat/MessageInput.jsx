import { useState, useEffect, useRef, Children } from "react";
import { Send, X, ImagePlus } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";


const MessageInput = ({ onSend, editingMessage, onCancelEdit, onSubmitEdit }) => {
    const [text, setText] = useState("");
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const { error } = useToast();
    const [previews, setPreviews] = useState([]);
    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.content);
            inputRef.current?.focus();
        }
    }, [editingMessage]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed && files.length === 0) return;
        const mediaTypes = files.map((file) =>
            file.type.startsWith("video") ? "video" : "photo"
        )
        if (editingMessage) {
            onSubmitEdit(editingMessage.id, trimmed);
        } else {
            onSend(trimmed, files, mediaTypes);
        }
        setText("");
        previews.forEach((preview) => {
            URL.revokeObjectURL(preview.url)
        })
        setPreviews([]);
        setFiles([]);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape" && editingMessage) {
            onCancelEdit();
            setText("");
        }
    };

    const handleSelectFiles = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.some((file) => file.size > 50 * 1048576)) {
            error("Maximum size of 50MB allowed!");
            return;
        }
        if (!selectedFiles.length) {
            return;
        }

        const updatedFiles = [...files, ...selectedFiles];

        if (updatedFiles.length > 10) {
            error("Maximum of 10 files allowed!");
            e.target.value = "";
            return;
        }

        setFiles(updatedFiles);

        const newPreviews = selectedFiles.map((file) => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "photo"
        }))

        setPreviews((prev) => [...prev, ...newPreviews]);
        e.target.value = "";
    }

    const removeFile = (index) => {
        const preview = previews[index];

        if (preview) {
            URL.revokeObjectURL(preview.url);
        }

        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
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
            <form onSubmit={handleSubmit} className="flex flex-col w-full items-center gap-2 px-3 py-3">

                {previews.length > 0 && (
                    <div className="w-full rounded-2xl border border-gray-700/70 bg-gray-950/70 p-3">
                        {/* Header */}
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ImagePlus size={16} className="text-blue-400" />
                                <span className="text-sm font-medium text-gray-200">
                                    Attachments
                                </span>
                                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                                    {previews.length}/10
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    previews.forEach((preview) =>
                                        URL.revokeObjectURL(preview.url)
                                    );
                                    setPreviews([]);
                                    setFiles([]);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                }}
                                className="text-xs text-gray-400 transition-colors hover:text-red-400"
                            >
                                Remove all
                            </button>
                        </div>

                        {/* Horizontal preview strip */}
                        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
                            {previews.map((preview, index) => (
                                <div
                                    key={preview.url}
                                    className="group relative h-24 w-24 shrink-0"
                                >
                                    <div className="h-full w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
                                        {preview.type === "photo" ? (
                                            <img
                                                src={preview.url}
                                                alt={`Attachment ${index + 1}`}
                                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                            />
                                        ) : (
                                            <video
                                                src={preview.url}
                                                muted
                                                playsInline
                                                className="h-full w-full object-cover"
                                            />
                                        )}

                                        {/* Video label */}
                                        {preview.type === "video" && (
                                            <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                VIDEO
                                            </span>
                                        )}
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        type="button"
                                        aria-label={`Remove attachment ${index + 1}`}
                                        onClick={() => removeFile(index)}
                                        className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-600 bg-gray-700 text-gray-200 shadow-lg transition-colors hover:border-red-400 hover:bg-red-500 hover:text-white"
                                    >
                                        <X size={13} />
                                    </button>

                                    {/* Attachment number */}
                                    <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                                        {index + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="w-full flex gap-2">
                    <button
                        type="button"
                        className="p-2 rounded-full hover:bg-gray-800 text-gray-400 transition-colors shrink-0"
                        title="Attach image"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="video/*,image/*"
                        hidden
                        onChange={handleSelectFiles}
                    />
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
                        disabled={!text.trim() && files.length === 0}
                        className="p-2.5 rounded-full bg-gray-700 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-gray-700 text-gray-100 transition-colors shrink-0"
                    >
                        <Send size={17} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageInput;