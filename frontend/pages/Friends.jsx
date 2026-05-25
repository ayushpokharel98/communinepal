import { useEffect, useMemo, useState } from "react";
import { UserCheck, UserPlus, UserSearch, UserX } from "lucide-react";
import Navbar from "../components/Navbar";
import IncomingFriendReq from "../src/assets/IncomingFriendReq";
import OutgoingFriendReq from "../src/assets/OutgoingFriendReq";
import All from "../src/All";
import api from "../services/api";
import { LucideMenu } from "lucide-react";
import authService from "../services/authService";
import friendService from "../services/friendService";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import PlainButton from "../components/PlainButton";

const Friends = () => {
    const [selectedTab, setSelectedTab] = useState("received");
    const [query, setQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const tabs = [
        {
            id: "received",
            label: "Received Friend Requests",
            icon: IncomingFriendReq,
            component: <ReceivedFriendReq />,
        },
        {
            id: "sent",
            label: "Sent Friend Requests",
            icon: OutgoingFriendReq,
            component: <SentFriendReq />,
        },
        {
            id: "friends",
            label: "All Friends",
            icon: All,
            component: <AllFriends />,
        },
    ];

    const activeTab = tabs.find((tab) => tab.id === selectedTab);


    return (
        <>
            <Navbar />
            <main className="mt-15 min-h-[calc(100vh-60px)] bg-gray-900 text-white flex flex-row">
                <button
                    onClick={() => setSidebarOpen(prev => !prev)}
                    className="sm:hidden fixed top-18 right-4 z-40 rounded-xl bg-gray-800 p-2 border border-gray-700"
                >
                    <LucideMenu className="size-6" />
                </button>

                {
                    sidebarOpen && (
                        <div
                            onClick={() => setSidebarOpen(false)}
                            className=" fixed inset-0  bg-black/50 z-30 sm:hidden" />
                    )
                }
                <aside
                    className={`fixed top-0 left-0 z-50 sm:z-auto h-screen w-70  bg-gray-800 border-r  border-gray-700 p-4 transition-transform duration-300 sm:translate-x-0 sm:static sm:h-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                >

                    <h1 className="text-2xl font-bold text-center tracking-wide">
                        FRIENDS
                    </h1>

                    {/* SEARCH */}
                    <div className="relative mt-8">
                        <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />

                        <input
                            type="search"
                            value={query}
                            onChange={(e) => {
                                setSelectedTab("");
                                setQuery(e.target.value);
                            }}
                            placeholder="Search users..."
                            className="w-full rounded-2xl border border-gray-600 bg-gray-900 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* NAVIGATION */}
                    <nav className="mt-6 flex flex-col gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = selectedTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setSelectedTab(tab.id);
                                        setSidebarOpen(false);
                                        setQuery("");
                                    }}
                                    className={`group flex items-center justify-between rounded-xl px-4 py-4 text-left transition-all duration-200 hover:bg-gray-700 ${isActive ? "bg-gray-700" : ""}`}
                                >
                                    <span className="font-medium text-xs">
                                        {tab.label}
                                    </span>

                                    <Icon
                                        className={`size-11 rounded-full p-2 transition
                                            ${isActive
                                                ? "bg-blue-600"
                                                : "bg-gray-600 group-hover:bg-gray-500"
                                            }
                                        `}
                                    />
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <section className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {query ? (
                        <SearchResults query={query} />
                    ) : (
                        activeTab?.component || <Default />
                    )}
                </section>
            </main>
        </>
    );
};

const Default = () => {
    return (
        <div className="flex h-full items-center justify-center text-gray-400">
            Select a section
        </div>
    );
};

const ReceivedFriendReq = () => {
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({
        type: "",
        message: ""
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const res = await friendService.receivedRequests();
                setReceivedRequests(res);

            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleAcceptRequest = async (friendshipId) => {
        try {
            await friendService.acceptRequest(friendshipId);
            setToast({ type: "success", message: "Friend Request Accepted!" })
            setReceivedRequests((prev) => prev.filter((request) => request.id !== friendshipId))
        } catch (err) {
            setToast({ type: "error", message: "Something went wrong, try again later!" })
        }
    }
    const handleRejectRequest = async (friendshipId) => {
        try {
            await friendService.rejectRequest(friendshipId);
            setToast({ type: "success", message: "Friend Request Rejected!" })
            setReceivedRequests((prev) => prev.filter((request) => request.id !== friendshipId))
        } catch (err) {
            setToast({ type: "error", message: "Something went wrong, try again later!" })
        }
    }

    return loading ? <Loading /> : (
        <div className="">
            <Toast type={toast.type} message={toast.message} setMessage={(msg) => setToast({ ...toast, message: msg })} />

            <h2 className="text-2xl font-semibold">
                Received Friend Requests
            </h2>
            {receivedRequests.length === 0 ? <p className="text-gray-400">
                No friend requests received
            </p> :
                <ul className="mt-5 flex flex-col gap-3">
                    {receivedRequests.map((req) => (
                        <li key={req.id} className="flex bg-gray-800 p-2 rounded-xl gap-2 items-center w-full">
                            <div className="flex-1 flex items-center gap-3">
                                <img src={req.other_user.profile_picture} className="rounded-full size-12" alt="" />
                                <Link className="hover:underline hover:underline-offset-3" to={`/profile/${req.other_user.username}`}>@{req.other_user.username}</Link>
                            </div>
                            <PlainButton type="success" text={<UserCheck />} onClick={() => handleAcceptRequest(req.id)}/>
                            <PlainButton type="error" text={<UserX />} onClick={() => handleRejectRequest(req.id)}/>
                        </li>
                    ))
                    }
                </ul>
            }
        </div>
    );
};

const SentFriendReq = () => {
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({
        type: "",
        message: ""
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const res = await friendService.sentRequests();
                setSentRequests(res);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleCancelRequest = async (friendshipId) => {
        try {
            await friendService.cancelRequest(friendshipId);
            setToast({ type: "success", message: "Friend Request Cancelled!" })
            setSentRequests((prev) => prev.filter((request) => request.id !== friendshipId))
        } catch (err) {
            setToast({ type: "error", message: "Something went wrong, try again later!" })
        }
    }

    return loading ? <Loading /> : (
        <div className="">
            <Toast type={toast.type} message={toast.message} setMessage={(msg) => setToast({ ...toast, message: msg })} />

            <h2 className="text-2xl font-semibold">
                Sent Friend Requests
            </h2>
            {sentRequests.length === 0 ? <p className="text-gray-400">
                No sent requests
            </p> :
                <ul className="mt-5 flex flex-col gap-3">
                    {sentRequests.map((req) => (
                        <li key={req.id} className="flex bg-gray-800 p-2 rounded-xl items-center w-full">
                            <div className="flex-1 flex items-center gap-3">
                                <img src={req.other_user.profile_picture} className="rounded-full size-12" alt="" />
                                <Link className="hover:underline hover:underline-offset-3" to={`/profile/${req.other_user.username}`}>@{req.other_user.username}</Link>
                            </div>
                            <PlainButton onClick={()=>handleCancelRequest(req.id)} text={"Cancel Request"}/>
                        </li>
                    ))
                    }
                </ul>
            }
        </div>
    );
};

const AllFriends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [toast, setToast] = useState({
        type: "",
        message: ""
    });
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const res = await friendService.viewAllFriends();
                setFriends(res);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [])
    const handleRemoveFriend = async (friendshipId) => {
        try {
            await friendService.removeFriend(friendshipId);
            setToast({ type: "success", message: "Friend Removed!" })
            setFriends((prev) => prev.filter((request) => request.id !== friendshipId))
        } catch (err) {
            setToast({ type: "error", message: "Something went wrong, try again later!" })
        }
    }
    return loading ? <Loading /> : (
        <div>
            <Toast type={toast.type} message={toast.message} setMessage={(msg) => setToast({ ...toast, message: msg })} />

            <h2 className="text-2xl font-semibold">
                All Friends
            </h2>
            {friends.length === 0 ? <p className="text-gray-400">
                No friends
            </p> :
                <div className="grid md:grid-cols-2 gap-3 mt-2">
                    {friends.map((friend) => (
                        <div key={friend.id} className="bg-gray-700 p-2 rounded-xl flex">
                            <div className="flex flex-1 items-center gap-2">
                                <img src={friend.other_user.profile_picture} className="size-12 rounded-full" alt="" />
                                <Link className="hover:underline hover:underline-offset-3" to={`/profile/${friend.other_user.username}`}>@{friend.other_user.username}</Link>
                            </div>
                            <PlainButton onClick={()=>handleRemoveFriend(friend.id)} type="error" text={"Remove"}/>
                        </div>
                    ))}
                </div>
            }
        </div>
    );
};

const SearchResults = ({ query }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [toast, setToast] = useState({
        type: "",
        message: ""
    });
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await authService.searchUsers(query);
                setUsers(res);
            } catch (err) {
            } finally {
                setLoading(false);
            }
        }
        fetchUsers()
    }, [query])
    const handleAddFriend = async (userId) => {
        try {
            await friendService.sendRequest(userId);

            setUsers(prev =>
                prev.map(user =>
                    user.user.id === userId
                        ? { ...user, request_pending: true }
                        : user
                )
            );

            setToast({
                type: "success",
                message: "Friend request sent!"
            });

        } catch (err) {
            setToast({
                type: "error",
                message: "Something went wrong, try again later!"
            });
        }
    };
    return (
        <div className="flex h-full flex-col">
            <Toast type={toast.type} message={toast.message} setMessage={(msg) => setToast({ ...toast, message: msg })} />

            <h2 className="text-2xl font-semibold">
                Search Results
            </h2>

            <p className="mt-2 text-gray-400">
                Searching for: "{query}"
            </p>

            <div className="results flex-1">

                {!users.length > 0 ? <div className=" text-gray-400 w-full h-full text-center content-center"> No users found! </div> :
                    <div
                        className=" mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-5"
                    > {users.map((user) => (
                        <div
                            key={user.user.id}
                            className="rounded-2xl border border-gray-700 bg-gray-800 overflow-hidden transition hover:-translate-y-1 hover:border-blue-500"
                        >
                            <div className="aspect-square overflow-hidden">
                                <img
                                    className="h-full w-full object-cover"
                                    src={user.profile_picture}
                                    alt={user.user.username}
                                />
                            </div>

                            <div className="p-4 flex flex-col gap-2">
                                <p className="text-sm text-gray-400">
                                    @{user.user.username}
                                </p>

                                <Link className="hover:underline hover:underline-offset-3" to={`/profile/${user.user.username}`}>{user.full_name}
                                    {user.user.full_name}
                                </Link>

                                <Button
                                    onClick={() => handleAddFriend(user.user.id)}
                                    disabled={user.is_friend || user.request_pending}
                                    Component={
                                        user.is_friend || user.request_pending
                                            ? null
                                            : UserPlus
                                    }
                                    text={user.is_friend ? "Already Friends" : user.request_pending ? "Request exists" : "Add Friend"}
                                />
                            </div>
                        </div>
                    ))}
                    </div>
                }
            </div>
        </div>
    );
};

export default Friends;