import { Heart, MessageCircleMore, Share, MoreHorizontal, Construction } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import PlainButton from "./PlainButton";
import postService from "../services/postService";
import CreatePost from "./CreatePost";
import MediaCarousel from "./MediaCarousel";
import Loading from "./Loading";
import { useToast } from "../contexts/ToastContext";
import EditProfileModal from "./EditProfileModal";
import Button from "./Button";
import { Link } from "react-router-dom"
import Comments from "./Comments";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
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

const Posts = ({ type, userId, username }) => {
  const { user } = useAuth();
  const [localPosts, setLocalPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();
  const [editPanel, setEditPanel] = useState(null);
  const [share, setShare] = useState(null);
  const menuRef = useRef(null);
  const endRef = useRef(null);
  const isFetchingRef = useRef(false);
  const [note, setNote] = useState("");
  const [commentPostId, setCommentPostId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setEditPanel(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, []);

  const fetchPosts = async (cursor = null) => {
    if (isFetchingRef.current || (!hasMore && cursor != null)) return;

    isFetchingRef.current = true;

    try {
      const res = type === "profile" ? await postService.getUserPosts(userId, cursor) : await postService.getFeed(cursor);

      const newPosts = res.results ?? res;
      const newCursor = res.next ? new URL(res.next).searchParams.get("cursor") : null;

      setLocalPosts((prev) => cursor === null ? newPosts : [...prev, ...newPosts]);
      setNextCursor(newCursor);
      setHasMore(!!newCursor);
    } catch (err) {
      console.log(err);

      error("Error retrieving posts, please try again later!")
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    setLocalPosts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchPosts(null);
  }, [userId])

  useEffect(() => {
    if (!endRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
        fetchPosts(nextCursor)
      }
    }, { threshold: 0.1 })

    observer.observe(endRef.current);

    return () => observer.disconnect();
  }, [hasMore, nextCursor])

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (postId, note = "") => {
    try {
      const result = await postService.toggleShare(postId, note);
      setLocalPosts((prev) =>
        prev.map((post) =>
          post.id !== postId
            ? post
            : { ...post, is_shared: result.shared, shares_count: result.shares_count }
        )
      );
      setNote("");
      setShare(null);
    } catch (error) {
      console.error(error);
    }
  };

  return loading ? <Loading /> : (
    <>
      {
        (user.user?.username === username || type === "main") ? <CreatePost
          onPostCreated={(newPost) =>
            setLocalPosts((prev) => [newPost, ...prev])
          } /> : ""
      }

      {!localPosts.length ? (
        <div className="w-full flex justify-center items-center text-gray-400 mt-5">
          No posts yet.
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 py-2 text-white">
          {localPosts.map((post) => (
            <div
              key={post.id}
              className="w-full max-w-xl bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <img
                  src={post.author_profile_picture}
                  alt={post.author_username}
                  className="rounded-full object-cover shrink-0 size-12"
                />
                <div className="flex flex-col min-w-0">
                  <Link to={`/profile/${post.author_username}`} className="font-medium text-white text-sm truncate hover:underline">
                    {post.author_username}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {timeAgo(post.created_at)}
                    <span className="mx-1">·</span>
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-auto relative" ref={menuRef}>
                  <button
                    onClick={() =>
                      setEditPanel((prev) => (prev === post.id ? null : post.id))
                    }
                    className="p-2 text-gray-400 hover:text-white transition-all rounded-full hover:bg-gray-700"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {editPanel === post.id && (
                    <div className="absolute right-0 top-8 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => handleEdit(post)}
                        className="w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        ✏️ Edit post
                      </button>

                      <div className="h-px bg-gray-700" />

                      <button
                        onClick={() => handleDelete(post.id)}
                        className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        🗑 Delete post
                      </button>
                    </div>
                  )}
                </div>
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

                <button onClick={() => setCommentPostId(post.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                  <MessageCircleMore size={16} />
                  Comment
                </button>

                <button
                  onClick={() => post.is_shared ? handleShare(post.id) : setShare((prev) => (prev === post.id) ? null : post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors hover:bg-gray-700 ${post.is_shared ? "text-blue-400" : "text-gray-400 hover:text-white"
                    }`}
                >
                  <Share size={16} />
                  {post.is_shared ? "Shared" : "Share"}
                </button>
              </div>
              {
                (share === post.id) &&
                <div className="flex items-center gap-2 px-3 py-1">
                  <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full placeholder:text-sm border border-gray-500 p-2 rounded-xl" placeholder="What do you have to say about this?" type="text" name="" id="" />
                  <Button onClick={() => handleShare(post.id, note)} className="mt-0!" text={"Share"} />
                </div>
              }

            </div>
          ))}
          <div ref={endRef} className="w-full flex justify-center py-4">
            {loading && <Loading />}
            {!hasMore && (
              <p className="text-gray-600 text-sm flex gap-1 items-center">You have reached the end <Construction /> </p>
            )}
          </div>
        </div>
      )}
      {commentPostId && (
        <Comments postId={commentPostId} onClose={() => setCommentPostId(null)} />
      )}
    </>
  );
};

export default Posts;