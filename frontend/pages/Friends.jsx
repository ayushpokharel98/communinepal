import { useEffect, useMemo, useState } from "react";
import { UserSearch } from "lucide-react";
import Navbar from "../components/Navbar";
import IncomingFriendReq from "../src/assets/IncomingFriendReq";
import OutgoingFriendReq from "../src/assets/OutgoingFriendReq";
import All from "../src/All";
import api from "../services/api";
import { LucideMenu } from "lucide-react";
import authService from "../services/authService";

const Friends = () => {
    const [selectedTab, setSelectedTab] = useState("received");
    const [query, setQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const tabs = useMemo(() => [
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
    ], []);

    const activeTab = tabs.find((tab) => tab.id === selectedTab);

    return (
        <>
            <Navbar />

            <main className="mt-15 min-h-[calc(100vh-60px)] bg-gray-900 text-white flex flex-row">
                <button
                    onClick={() => setSidebarOpen(prev => !prev)}
                    className="sm:hidden fixed top-18 right-4 z-50 rounded-xl bg-gray-800 p-2 border border-gray-700"
                >
                    <LucideMenu className="size-6" />
                </button>

                {
                    sidebarOpen && (
                        <div
                            onClick={() => setSidebarOpen(false)}
                            className=" fixed inset-0  bg-black/50 z-40 sm:hidden" />
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

                {/* CONTENT */}
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
    return (
        <div>
            <h2 className="text-xl font-semibold tracking-wide">
                Received Friend Requests
            </h2>
        </div>
    );
};

const SentFriendReq = () => {
    return (
        <div>
            <h2 className="text-2xl font-semibold">
                Sent Friend Requests
            </h2>
        </div>
    );
};

const AllFriends = () => {
    return (
        <div>
            <h2 className="text-2xl font-semibold">
                All Friends
            </h2>
        </div>
    );
};

const SearchResults = ({ query }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await authService.searchUsers(query);
                setUsers(res);
            } catch (err) {
                console.log(err);

            } finally {
                setLoading(false);
            }
        }
        fetchUsers()
    }, [query])
    const handleAddFriend = async () => {

    }
    return (
        <div className="flex h-full flex-col">
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

                                <p className="font-semibold truncate">
                                    {user.user.full_name}
                                </p>

                                <button
                                    onClick={() => handleAddFriend(user.user.id)}
                                    className="mt-2 rounded-xl bg-blue-600 px-4 py-2 font-medium transition hover:bg-blue-700 active:scale-[0.98]"
                                >
                                    Add Friend
                                </button>
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