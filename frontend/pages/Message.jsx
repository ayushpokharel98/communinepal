import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/chat/Sidebar";
import ChatWindow, { EmptyChatState } from "../components/chat/ChatWindow";
import chatService from "../services/chatService";
import friendService from "../services/friendService";
import { useAuth } from "../contexts/AuthContext";
const Message = () => {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);

    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(true);

    const [activeConversation, setActiveConversation] = useState(null);
    // controls which pane is visible on mobile: sidebar list vs full-width chat
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const data = await chatService.getConversations();
                setConversations(data);
            } catch (err) {
                console.error("Failed to load conversations", err);
            } finally {
                setConversationsLoading(false);
            }
        };

        const loadFriends = async () => {
            try {
                const data = await friendService.viewAllFriends();
                setFriends(data);
            } catch (err) {
                console.error("Failed to load friends", err);
            } finally {
                setFriendsLoading(false);
            }
        };

        loadConversations();
        loadFriends();
    }, []);

    const handleSelectConversation = useCallback((conversation) => {
        setActiveConversation(conversation);
        setShowChatOnMobile(true);
    }, []);

    const handleSelectFriend = useCallback(
        async (friend) => {
            // reuse an existing conversation with this friend if there is one
            const existing = conversations.find((c) => c.other_user?.id === friend.id);
            if (existing) {
                handleSelectConversation(existing);
                return;
            }

            try {
                const conversation = await chatService.createConversation(friend.username);
                setConversations((prev) => [conversation, ...prev]);
                handleSelectConversation(conversation);
            } catch (err) {
                console.error("Failed to start conversation", err);
            }
        },
        [conversations, handleSelectConversation]
    );

    const handleBack = useCallback(() => {
        setShowChatOnMobile(false);
    }, []);

    return (
        <>
            <Navbar />
            <main className="w-full mt-15 h-[calc(100vh-60px)] bg-gray-900 flex overflow-hidden">
                <Sidebar
                    friends={friends}
                    friendsLoading={friendsLoading}
                    conversations={conversations}
                    conversationsLoading={conversationsLoading}
                    activeConversationId={activeConversation?.id}
                    onSelectConversation={handleSelectConversation}
                    onSelectFriend={handleSelectFriend}
                    isMobileHidden={showChatOnMobile}
                />

                {activeConversation ? (
                    <div className={`flex-1 min-w-0 ${showChatOnMobile ? "flex" : "hidden md:flex"}`}>
                        <ChatWindow
                            conversation={activeConversation}
                            currentUserId={user.user?.id}
                            onBack={handleBack}
                        />
                    </div>
                ) : (
                    <EmptyChatState />
                )}
            </main>
        </>
    );
};

export default Message;