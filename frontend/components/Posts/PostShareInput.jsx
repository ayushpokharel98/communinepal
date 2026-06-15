import Button from "../Button";
const PostShareInput = ({ note, onNoteChange, onShare }) => (
  <div className="flex items-center gap-2 px-3 py-1">
    <input
      value={note}
      onChange={(e) => onNoteChange(e.target.value)}
      className="w-full placeholder:text-sm border border-gray-500 p-2 rounded-xl text-white"
      placeholder="What do you have to say about this?"
      type="text"
    />
    <Button onClick={onShare} className="mt-0!" text="Share" />
  </div>
);

export default PostShareInput;