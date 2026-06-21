import { SquarePen } from "lucide-react";
import FriendsRail from "./FriendsRail";
import ConversationsList from "./ConversationsList";

const Sidebar = ({
    friends,
    friendsLoading,
    conversations,
    conversationsLoading,
    activeConversationId,
    onSelectConversation,
    onSelectFriend,
    isMobileHidden,
}) => {
    return (
        <aside
            className={`
                w-full md:w-85 shrink-0 h-[calc(100vh-60px)] bg-gray-900 border-r border-gray-800
                flex flex-col
                ${isMobileHidden ? "hidden md:flex" : "flex"}
            `}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h1 className="text-lg font-semibold text-gray-100">Messages</h1>
                <button
                    className="p-2 rounded-full hover:bg-gray-800 text-gray-300 transition-colors"
                    title="New message"
                >
                    <SquarePen size={19} />
                </button>
            </div>

            <FriendsRail friends={friends} loading={friendsLoading} onSelectFriend={onSelectFriend} />

            <ConversationsList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={onSelectConversation}
                loading={conversationsLoading}
            />
        </aside>
    );
};

export default Sidebar;