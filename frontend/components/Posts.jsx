import { Heart, MessageCircleMore, Share, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import PlainButton from "./PlainButton";
import postService from "../services/postService";
import CreatePost from "./CreatePost";
import MediaCarousel from "./MediaCarousel";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function AvatarOrInitials({ src, username, size = 42 }) {
  const [failed, setFailed] = useState(false);
  const initials = username?.slice(0, 2).toUpperCase() ?? "??";
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={username}
        onError={() => setFailed(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-700 font-medium text-sm"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

function MediaGrid({ media }) {
  const count = media.length;
  const gridClass =
    count === 1 ? "grid-cols-1" :
      count === 2 ? "grid-cols-2" :
        count === 3 ? "grid-cols-2" :
          "grid-cols-2";

  return (
    <div className={`grid gap-0.5 ${gridClass}`}>
      {media.map((m, i) => (
        <div
          key={m.id}
          className={count === 3 && i === 0 ? "col-span-2" : ""}
        >
          {m.media_type === "photo" ? (
            <img
              src={m.file_url}
              alt=""
              className="w-full object-cover"
              style={{ height: count === 1 ? 320 : 200 }}
            />
          ) : (
            <video
              src={m.file_url}
              controls
              className="w-full object-cover"
              style={{ height: count === 1 ? 320 : 200 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const Posts = ({ posts = [] }) => {
  const { user } = useAuth();
  const [localPosts, setLocalPosts] = useState(posts);

  const handleLike = async (postId) => {
    try {
      const result = await postService.toggleLike(postId);
      setLocalPosts((prev) =>
        prev.map((post) =>
          post.id !== postId
            ? post
            : { ...post, is_liked: result.liked, likes_count: result.likes_count }
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async (postId) => {
    try {
      const result = await postService.toggleShare(postId);
      setLocalPosts((prev) =>
        prev.map((post) =>
          post.id !== postId
            ? post
            : { ...post, is_shared: result.shared, shares_count: result.shares_count }
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <CreatePost
        onPostCreated={(newPost) =>
          setLocalPosts((prev) => [newPost, ...prev])
        }
      />

      {!localPosts.length ? (
        <div className="w-full flex justify-center items-center text-gray-400 mt-5">
          No posts yet.
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 py-2">
          {localPosts.map((post) => (
            <div
              key={post.id}
              className="w-full max-w-xl bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <AvatarOrInitials
                  src={post.author_profile_picture}
                  username={post.author_username}
                />
                <div className="flex flex-col min-w-0">
                  <p className="font-medium text-white text-sm truncate">
                    {post.author_username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {timeAgo(post.created_at)}
                    <span className="mx-1">·</span>
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button className="ml-auto p-1 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-700">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="px-4 pb-3 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {post.caption}
                </p>
              )}

              {/* Media */}
              {post.media?.length > 0 && <MediaCarousel media={post.media} />}

              {/* Stats */}
              <div className="flex justify-between text-xs text-gray-400 px-4 py-2.5 border-b border-gray-700">
                <div className="flex items-center gap-1">
                  <span>{post.likes_count} likes</span>
                  <span className="mx-1 opacity-40">·</span>
                  <span>{post.comments_count} comments</span>
                </div>
                <span>{post.shares_count} shares</span>
              </div>

              {/* Actions */}
              <div className="flex divide-x divide-gray-700">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors hover:bg-gray-700 ${post.is_liked ? "text-red-400" : "text-gray-400 hover:text-white"
                    }`}
                >
                  <Heart
                    size={16}
                    className={post.is_liked ? "fill-red-400" : ""}
                  />
                  Like
                </button>

                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                  <MessageCircleMore size={16} />
                  Comment
                </button>

                <button
                  onClick={() => handleShare(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors hover:bg-gray-700 ${post.is_shared ? "text-blue-400" : "text-gray-400 hover:text-white"
                    }`}
                >
                  <Share size={16} />
                  {post.is_shared ? "Shared" : "Share"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Posts;