import { ArrowLeft, Phone, Video, Info } from "lucide-react";

const ChatHeader = ({ otherUser, onBack }) => {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={onBack}
                    className="md:hidden p-1.5 -ml-1.5 rounded-full hover:bg-gray-800 text-gray-300 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <img
                    src={otherUser?.profile_picture}
                    alt={otherUser?.username}
                    className="w-10 h-10 rounded-full object-cover bg-gray-700 shrink-0"
                />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">
                        {otherUser?.full_name || otherUser?.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{otherUser?.username}</p>
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                <button
                    className="p-2.5 rounded-full hover:bg-gray-800 text-gray-300 transition-colors"
                    title="Voice call"
                >
                    <Phone size={19} />
                </button>
                <button
                    className="p-2.5 rounded-full hover:bg-gray-800 text-gray-300 transition-colors"
                    title="Video call"
                >
                    <Video size={19} />
                </button>
                <button
                    className="p-2.5 rounded-full hover:bg-gray-800 text-gray-300 transition-colors hidden sm:inline-flex"
                    title="Conversation info"
                >
                    <Info size={19} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;