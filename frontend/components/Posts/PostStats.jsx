const PostStats = ({ likesCount, commentsCount, sharesCount }) => (
  <div className="flex justify-between text-xs text-gray-400 px-4 py-2.5 border-b border-gray-700">
    <div className="flex items-center gap-1">
      <span>{likesCount} likes</span>
      <span className="mx-1 opacity-40">·</span>
      <span>{commentsCount} comments</span>
    </div>
    <span>{sharesCount} shares</span>
  </div>
);

export default PostStats;