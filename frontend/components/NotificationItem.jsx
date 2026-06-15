import { Link } from "react-router-dom";
import timeAgo from "../services/timeAgo";
import { Check, X } from "lucide-react";
import notificationService from "../services/notificationService";
import { useToast } from "../contexts/ToastContext";
import { useNotifications } from "../contexts/NotificationContext";
const NotificationItem = ({ notification }) => {

  const { error } = useToast();
  const { setNotifications } = useNotifications();
  const notificationType = notification.notification_type;
  const redirectLink = (notificationType === "post" || notificationType === "post_liked" || notificationType === "comment") ? `/post/${notification.data.post_id}` : (notificationType === "friend_request") ? "/friends" : "";
  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((p) => p.id !== notification.id ? p : { ...p, is_read: true }));

    } catch {
      error("Error marking read, please try again later!")
    }
  }
  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((p) => p.id !== id));
    } catch {
      error("Error deleting notification, please try again later!")
    }
  }
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
        {
          (redirectLink) ? (
            <Link to={redirectLink} className="text-sm hover:underline hover:underline-offset-1">
              {notification.message}
            </Link>) : (
            <p className="text-sm">
              {notification.message}
            </p>
          )
        }
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

      {!notification.is_read ? (
        <>
          <div title="Mark as read">
            <Check onClick={() => handleMarkRead(notification.id)} className="size-4 hover:text-green-700 transition-colors duration-300" />
          </div>
          <div className="size-2 bg-blue-500 rounded-full" />
        </>
      ) :
        <div title="Delete">
          <X onClick={() => handleDeleteNotification(notification.id)} className="size-4 hover:text-red-700 transition-colors duration-300" />
        </div>
      }
    </div>
  );
};

export default NotificationItem;