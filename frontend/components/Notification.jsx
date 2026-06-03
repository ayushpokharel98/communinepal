import NotificationItem from "./NotificationItem";

const NotificationDropdown = ({
  notifications,
  showUnreadOnly,
  setShowUnreadOnly,
}) => {
  const filtered = showUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="fixed top-14 left-0 bg-gray-900 right-0 bottom-0 text-white z-50 sm:absolute sm:top-16 sm:left-1/2 sm:-translate-x-1/2
      sm:h-125 sm:w-100
      sm:rounded-xl sm:border sm:border-gray-700 sm:overflow-hidden">

      <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700">
        <h2 className="font-bold text-xl">
          Notifications
        </h2>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowUnreadOnly(false)}
            className={`px-3 py-1 rounded-lg ${
              !showUnreadOnly
                ? "bg-blue-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setShowUnreadOnly(true)}
            className={`px-3 py-1 rounded-lg ${
              showUnreadOnly
                ? "bg-blue-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex flex-col gap-1 h-full pb-24">
        {filtered.length ? (
          filtered.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
        ) : (
          <div className="text-center text-gray-400 py-10">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;