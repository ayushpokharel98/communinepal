import { useState } from "react";
import Button from "../Button";
import PlainButton from "../PlainButton";

const PostCaption = ({ post, editingPost, editingCaption, setEditingCaption, onUpdate, onCancelEdit }) => {
  const [expanded, setExpanded] = useState(false);

  if (!post.caption) return null;

  if (editingPost === post.id) {
    return (
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <textarea
            value={editingCaption}
            onChange={(e) => setEditingCaption(e.target.value)}
            maxLength={500}
            rows={1}
            className="flex-1 p-3 rounded-xl bg-gray-900 border border-gray-600 text-sm text-white resize-none focus:outline-none focus:border-blue-500"
          />
          <div className="flex flex-col gap-2">
            <Button className="mt-0!" text="Update" onClick={() => onUpdate(post.id)} />
            <PlainButton text="Cancel" type="error" onClick={onCancelEdit} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      <p className={`text-sm text-gray-200 whitespace-pre-wrap wrap-break-word ${expanded ? "" : "line-clamp-3"}`}>
        {post.caption}
      </p>

      {post.caption.length > 120 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

export default PostCaption;