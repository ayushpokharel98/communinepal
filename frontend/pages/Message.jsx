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
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8000/ws/chat/conversation/");
        socket.onopen = () => {
            console.log("Conversation socket initialized!");

        }
        socket.onclose = () => {
            console.log("Conversation socket disconnected!")
        }
        socket.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            console.log(payload);
            
            if (payload.type === "new") {
                setConversations((prev) => [
                    {
                        ...payload.data,
                        last_event: null,
                    },
                    ...prev,
                ]);
            }

            if (payload.type === "update") {
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === payload.data.id
                            ? {
                                ...c,
                                last_event: payload.data.last_event,
                            }
                            : c
                    )
                );
            }
        };
        return () => {
            socket.close();
        }
    }, [])

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
            const existing = conversations.find((c) => c.other_user?.id === friend.other_user.id);
            if (existing) {
                handleSelectConversation(existing);
                return;
            }

            try {
                const optimisticConversation = {
                    other_user: {
                        "id": friend.other_user.id,
                        "username": friend.other_user.username,
                        "full_name": friend.other_user.full_name,
                        "profile_picture": friend.other_user.profile_picture
                    },
                    optimistic: true
                };
                handleSelectConversation(optimisticConversation);
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
                            setConversations={setConversations}
                            setActiveConversation={handleSelectConversation}
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