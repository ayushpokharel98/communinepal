import { MoreHorizontal, Pen, Trash } from "lucide-react";
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import timeAgo from "../../services/timeAgo";
const PostHeader = ({ post, currentUsername, editPanel, setEditPanel, onEditClick, onDeleteClick }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setEditPanel(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setEditPanel]);

  const isOwner = currentUsername === post.author_username;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <img
        src={post.author_profile_picture}
        alt={post.author_username}
        className="rounded-full object-cover shrink-0 size-12"
      />

      <div className="flex flex-col min-w-0">
        <Link
          to={`/profile/${post.author_username}`}
          className="font-medium text-white text-sm truncate hover:underline"
        >
          {post.author_username}
        </Link>
        <p className="text-xs text-gray-400">
          {timeAgo(post.created_at)}
          <span className="mx-1">·</span>
          {new Date(post.created_at).toLocaleDateString()}
        </p>
      </div>

      {isOwner && (
        <div className="ml-auto relative">
          <button
            onClick={(e) => { e.stopPropagation(); setEditPanel((prev) => (prev === post.id ? null : post.id)) }}
            className="p-2 text-gray-400 hover:text-white transition-all rounded-full hover:bg-gray-700"
          >
            <MoreHorizontal size={18} />
          </button>

          {editPanel === post.id && (
            <div
              ref={menuRef}
              className="absolute right-0 top-8 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                onClick={() => {
                  onEditClick();
                  setEditPanel(null);
                }}
                className="w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Pen size={14} /> Edit post
              </button>

              <div className="h-px bg-gray-700" />

              <button
                onClick={() => onDeleteClick(post.id)}
                className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <Trash size={14} /> Delete post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostHeader;