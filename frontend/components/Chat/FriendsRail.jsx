const FriendsRail = ({ friends, onSelectFriend, loading }) => {    
    return (
        <div className="px-3 pt-3 pb-2 border-b border-gray-800">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                Friends
            </h2>

            {loading ? (
                <div className="flex gap-3 px-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
                            <div className="w-14 h-14 rounded-full bg-gray-700" />
                            <div className="w-10 h-2 rounded bg-gray-700" />
                        </div>
                    ))}
                </div>
            ) : friends.length === 0 ? (
                <p className="text-xs text-gray-500 px-1 py-2">No friends yet</p>
            ) : (
                <div className="flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {friends.map((friend) => (
                        <button
                            key={friend.id}
                            onClick={() => onSelectFriend(friend)}
                            className="flex flex-col items-center gap-1.5 shrink-0 group"
                        >
                            <span className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-gray-500 transition-all">
                                <img
                                    src={friend.other_user.profile_picture}
                                    alt={friend.other_user.username}
                                    className="w-full h-full object-cover bg-gray-700"
                                />
                            </span>
                            <span className="text-[11px] text-gray-300 max-w-14 truncate">
                                {friend.other_user.username}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendsRail;