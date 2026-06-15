import PostHeader from "./PostHeader";
import PostCaption from "./PostCaption";
import PostStats from "./PostStats";
import PostActions from "./PostActions";
import PostShareInput from "./PostShareInput";
import MediaCarousel from "./MediaCarousel";

const PostCard = ({
  post,
  currentUsername,
  editPanel,
  setEditPanel,
  editingPost,
  editingCaption,
  setEditingCaption,
  sharePostId,
  shareNote,
  onShareNoteChange,
  onLike,
  onComment,
  onShareToggle,
  onShareSubmit,
  onEditClick,
  onEditSubmit,
  onCancelEdit,
  onDelete,
  single
}) => {
  return (
    <div className="w-full max-w-xl bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
      <PostHeader
        post={post}
        currentUsername={currentUsername}
        editPanel={editPanel}
        setEditPanel={setEditPanel}
        onEditClick={() => onEditClick(post)}
        onDeleteClick={onDelete}
      />

      <PostCaption
        post={post}
        editingPost={editingPost}
        editingCaption={editingCaption}
        setEditingCaption={setEditingCaption}
        onUpdate={onEditSubmit}
        onCancelEdit={onCancelEdit}
      />

      {post.media?.length > 0 && <MediaCarousel media={post.media} />}

      <PostStats
        likesCount={post.likes_count}
        commentsCount={post.comments_count}
        sharesCount={post.shares_count}
      />

      <PostActions
        post={post}
        onLike={onLike}
        onComment={onComment}
        onShare={onShareToggle}
        single = {single}
      />

      {sharePostId === post.id && (
        <PostShareInput
          note={shareNote}
          onNoteChange={onShareNoteChange}
          onShare={() => onShareSubmit(post.id)}
        />
      )}
    </div>
  );
};

export default PostCard;