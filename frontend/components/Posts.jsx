import { useEffect, useRef, useState } from "react";
import { Construction } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import CreatePost from "./Posts/CreatePost";
import Comments from "./Posts/Comments";
import PostCard from "./Posts/PostCard";
import Loading from "./Loading";
import postService from "../services/postService";

const Posts = ({ type, userId, username }) => {
  const { user, setUser } = useAuth();
  const { success, error } = useToast();

  const [localPosts, setLocalPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const [editPanel, setEditPanel] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingCaption, setEditingCaption] = useState("");

  const [sharePostId, setSharePostId] = useState(null);
  const [shareNote, setShareNote] = useState("");

  const [commentPostId, setCommentPostId] = useState(null);

  const endRef = useRef(null);
  const isFetchingRef = useRef(false);
  const islikingRef = useRef(false);

  const fetchPosts = async (cursor = null) => {
    if (isFetchingRef.current || (!hasMore && cursor != null)) return;
    isFetchingRef.current = true;

    try {
      const res =
        type === "profile"
          ? await postService.getUserPosts(userId, cursor)
          : await postService.getFeed(cursor);      

      const newPosts = res.results ?? res;
      const newCursor = res.next
        ? new URL(res.next).searchParams.get("cursor")
        : null;

      setLocalPosts((prev) => (cursor === null ? newPosts : [...prev, ...newPosts]));
      setNextCursor(newCursor);
      setHasMore(!!newCursor);
    } catch (err) {
      console.error(err);
      error("Error retrieving posts, please try again later!");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    setLocalPosts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchPosts(null);
  }, [userId]);

  useEffect(() => {
    if (!endRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          fetchPosts(nextCursor);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [hasMore, nextCursor]);


  const handleLike = async (postId) => {
    if(islikingRef.current) return;
    try {
      islikingRef.current = true;
      const result = await postService.toggleLike(postId);
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : { ...p, is_liked: result.liked, likes_count: result.likes_count }
        )
      );
    } catch (err) {
      console.error(err);
    }finally{
      islikingRef.current = false;
    }
  };

  const handleShareToggle = (postId) => {
    const post = localPosts.find((p) => p.id === postId);
    if (post?.is_shared) {
      handleShareSubmit(postId);
    } else {
      setSharePostId((prev) => (prev === postId ? null : postId));
    }
  };

  const handleShareSubmit = async (postId) => {
    try {
      const result = await postService.toggleShare(postId, shareNote);
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : { ...p, is_shared: result.shared, shares_count: result.shares_count }
        )
      );
      setShareNote("");
      setSharePostId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await postService.deletePost(postId);
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
      setUser((prev)=>({...prev, posts_count:prev.posts_count-1}))
      error("Post deleted successfully!");
    } catch (err) {
      error("Error deleting post, please try again later!");
    }
  };

  const handleEditClick = (post) => {
    setEditingPost(post.id);
    setEditingCaption(post.caption);
  };

  const handleEditSubmit = async (postId) => {
    try {
      const updated = await postService.updatePost(postId, editingCaption );
      setLocalPosts((prev) =>
        prev.map((p) => (p.id !== postId ? p : { ...p, caption: updated.caption }))
      );
      setEditingPost(null);
      setEditingCaption("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditingCaption("");
  };


  if (loading) return <Loading />;

  const showCreatePost = user.user?.username === username || type === "main";

  return (
    <>
      {showCreatePost && (
        <CreatePost onPostCreated={(newPost) => setLocalPosts((prev) => [newPost, ...prev])} />
      )}

      {!localPosts.length ? (
        <div className="w-full flex justify-center items-center text-gray-400 mt-5">
          No posts yet.
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 py-2 text-white">
          {localPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUsername={user.user.username}
              editPanel={editPanel}
              setEditPanel={setEditPanel}
              editingPost={editingPost}
              editingCaption={editingCaption}
              setEditingCaption={setEditingCaption}
              sharePostId={sharePostId}
              shareNote={shareNote}
              onShareNoteChange={setShareNote}
              onLike={handleLike}
              onComment={setCommentPostId}
              onShareToggle={handleShareToggle}
              onShareSubmit={handleShareSubmit}
              onEditClick={handleEditClick}
              onEditSubmit={handleEditSubmit}
              onCancelEdit={handleCancelEdit}
              onDelete={handleDelete}
            />
          ))}

          <div ref={endRef} className="w-full flex justify-center py-4">
            {loading && <Loading />}
            {!hasMore && (
              <p className="text-gray-600 text-sm flex gap-1 items-center">
                You have reached the end <Construction />
              </p>
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