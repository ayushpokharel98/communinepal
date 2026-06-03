import {
  Image,
  Video,
  X,
} from "lucide-react";

import { useRef, useState } from "react";

import postService from "../../services/postService";
import Loading from "../Loading";
import { useToast } from "../../contexts/ToastContext";


const CreatePost = ({ onPostCreated }) => {

  const fileInputRef = useRef(null);

  const [caption, setCaption] = useState("");

  const [files, setFiles] = useState([]);

  const [previews, setPreviews] = useState([]);

  const [loading, setLoading] = useState(false);

  const {success,error} = useToast();

  const handleSelectFiles = (e) => {

    const selectedFiles = Array.from(e.target.files || []);
    if(selectedFiles.some((file)=>file.size>50*1048576)){
      error("Maximum size of 50MB allowed!")
      return;
    }
    if (!selectedFiles.length) {
      return;
    }

    const updatedFiles = [...files, ...selectedFiles];

    if (updatedFiles.length > 10) {
      error("Maximum 10 files allowed.");
      return;
    }

    setFiles(updatedFiles);

    const newPreviews = selectedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video")
        ? "video"
        : "photo",
    }));

    setPreviews((prev) => [
      ...prev,
      ...newPreviews,
    ]);
  };

  const removeFile = (index) => {

    const updatedFiles = [...files];

    const updatedPreviews = [...previews];

    URL.revokeObjectURL(
      updatedPreviews[index].url
    );

    updatedFiles.splice(index, 1);

    updatedPreviews.splice(index, 1);

    setFiles(updatedFiles);

    setPreviews(updatedPreviews);
  };

  const handleSubmit = async () => {

    if (
      !caption.trim() &&
      files.length === 0
    ) {
      return;
    }

    try {

      setLoading(true);

      const mediaTypes = files.map((file) =>
        file.type.startsWith("video")
          ? "video"
          : "photo"
      );

      const createdPost =
        await postService.createPost({
          caption,
          files,
          mediaTypes,
        });

      setCaption("");

      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });

      setFiles([]);

      setPreviews([]);
      success("Post Created Successfully!");
      if (onPostCreated) {
        onPostCreated({...createdPost, likes_count:0, shares_count:0, comments_count:0});
      }

    } catch (err) {
      error("Check your files and try again!")
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto max-w-xl bg-gray-800 rounded-2xl border border-gray-700 p-4">

      <textarea
        value={caption}
        onChange={(e) =>
          setCaption(e.target.value)
        }
        placeholder="What's on your mind?"
        className="
          w-full bg-transparent resize-none
          outline-none text-white
          placeholder:text-gray-400
          min-h-5
        "
      />

      {previews.length > 0 && (

        <div
          className={`
            mt-4 grid gap-2 overflow-hidden rounded-xl
            ${
              previews.length === 1
                ? "grid-cols-1"
                : previews.length === 2
                ? "grid-cols-2"
                : "grid-cols-4"
            }
          `}
        >

          {previews.map((preview, index) => (

            <div
              key={index}
              className="relative rounded-xl overflow-hidden"
            >

              <button
                onClick={() =>
                  removeFile(index)
                }
                className="
                  absolute top-1 left-0.5 z-10
                  bg-black/70 hover:bg-black
                  rounded-full p-1
                  transition
                "
              >
                <X
                  className="text-white"
                  size={16}
                />
              </button>

              {preview.type === "photo" ? (

                <img
                  src={preview.url}
                  alt=""
                  className="
                    size-24
                    sm:size-32
                    object-cover
                  "
                />

              ) : (

                <video
                  src={preview.url}
                  controls
                  className="
                    size-24
                    sm:size-32
                    object-cover
                  "
                />

              )}

            </div>

          ))}

        </div>
      )}

      {/* ACTIONS */}

      <div className="flex justify-between items-center mt-4">

        {/* MEDIA BUTTONS */}

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="
              flex items-center gap-2
              px-3 py-2 rounded-xl
              bg-gray-700 hover:bg-gray-600
              transition text-sm
            "
          >

            <Image size={18} />

            <span>Photo / Video</span>

          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept="image/*,video/*"
            onChange={handleSelectFiles}
          />

        </div>


        <button
          onClick={handleSubmit}
          disabled={loading}
          className="
            px-5 py-2 rounded-xl
            bg-blue-600 hover:bg-blue-700
            disabled:opacity-50
            transition flex items-center gap-2
            font-medium
          "
        >

          {loading && (
            <Loading />
          )}

          Post

        </button>

      </div>

    </div>
  );
};


export default CreatePost;