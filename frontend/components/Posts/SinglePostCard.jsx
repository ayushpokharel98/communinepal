import PostHeader from "./PostHeader";
import PostCaption from "./PostCaption";
import PostStats from "./PostStats";
import PostActions from "./PostActions";
import PostShareInput from "./PostShareInput";
import MediaCarousel from "./MediaCarousel";

const SinglePostCard = ({
  post,
  shareOpen,
  shareNote,
  setShareNote,
  onLike,
  onShareToggle,
  onShareSubmit,
}) => {
  if (!post) return null;

  return (
    <div className="w-full max-w-xl bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      <PostHeader
        post={post}
        currentUsername={null}
        editPanel={null}
        setEditPanel={() => {}}
      />

      <PostCaption post={post} />

      {post.media?.length > 0 && (
        <MediaCarousel media={post.media} />
      )}

      <PostStats
        likesCount={post.likes_count}
        commentsCount={post.comments_count}
        sharesCount={post.shares_count}
      />

      <PostActions
        post={post}
        onLike={onLike}
        onComment={() => {}}
        onShare={onShareToggle}
        single={true}
      />

      {shareOpen && (
        <PostShareInput
          note={shareNote}
          onNoteChange={setShareNote}
          onShare={onShareSubmit}
        />
      )}
    </div>
  );
};

export default SinglePostCard;