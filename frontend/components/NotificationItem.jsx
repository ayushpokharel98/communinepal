import { Link } from "react-router-dom";
import timeAgo from "../services/timeAgo";
import { Check } from "lucide-react";
const NotificationItem = ({ notification }) => {  
  return (
    <div
      className={`flex items-center gap-3 p-3 transition hover:bg-gray-700
      ${!notification.is_read ? "bg-gray-800/50" : ""}`}
    >
      <Link to={`/profile/${notification.actor_username}`}>
        <img
          src={notification.actor_profile_picture}
          alt=""
          className="size-12 rounded-full object-cover"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/post/${notification.data.post_id}`} className="text-sm hover:underline hover:underline-offset-1">
          {notification.message}
        </Link>

        <p className="text-xs text-gray-400 mt-1">
          {timeAgo(notification.created_at)}
          <span className="mx-1">·</span>
          {new Date(notification.created_at).toLocaleDateString()}
        </p>
      </div>

      {notification.preview_image && (
        <img
          src={notification.preview_image}
          alt=""
          className="size-12 rounded object-cover"
        />
      )}

      {!notification.is_read && (
        <>
        <Check className="size-4 hover:text-green-700 transition-colors duration-300"/>
        <div className="size-2 bg-blue-500 rounded-full" />
        </>
      )}
    </div>
  );
};

export default NotificationItem;