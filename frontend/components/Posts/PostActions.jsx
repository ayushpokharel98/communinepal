import { Heart, MessageCircleMore, Share } from "lucide-react";

const PostActions = ({ post, onLike, onComment, onShare, single }) => (
  <div className="flex divide-x divide-gray-700">
    <button
      onClick={() => onLike(post.id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors hover:bg-gray-700 ${post.is_liked ? "text-red-400" : "text-gray-400 hover:text-white"
        }`}
    >
      <Heart size={16} className={post.is_liked ? "fill-red-400" : ""} />
      Like
    </button>

    {!single && (
      <button
        onClick={() => onComment(post.id)}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
      >
        <MessageCircleMore size={16} />
        Comment
      </button>
    )}

    <button
      onClick={() => onShare(post.id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors hover:bg-gray-700 ${post.is_shared ? "text-blue-400" : "text-gray-400 hover:text-white"
        }`}
    >
      <Share size={16} />
      {post.is_shared ? "Shared" : "Share"}
    </button>
  </div>
);

export default PostActions;