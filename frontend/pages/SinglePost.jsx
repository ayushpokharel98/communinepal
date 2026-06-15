import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import postService from "../services/postService";
import { useToast } from "../contexts/ToastContext";

import Navbar from "../components/Navbar";
import Comments from "../components/Posts/Comments";
import SinglePostCard from "../components/Posts/SinglePostCard";

const SinglePost = () => {
  const { postId } = useParams();
  const { error } = useToast();

  const [post, setPost] = useState(null);
  const [shareNote, setShareNote] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await postService.getPost(postId);
        setPost(res);
      } catch {
        error("Error fetching post, please try again!");
      }
    };

    fetchPost();
  }, [postId]);

  const handleLike = async () => {
    try {
      const result = await postService.toggleLike(postId);

      setPost((prev) => ({
        ...prev,
        is_liked: result.liked,
        likes_count: result.likes_count,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareToggle = () => {
    if (post?.is_shared) {
      handleShareSubmit();
    } else {
      setShareOpen((prev) => !prev);
    }
  };

  const handleShareSubmit = async () => {
    try {
      const result = await postService.toggleShare(
        postId,
        shareNote
      );

      setPost((prev) => ({
        ...prev,
        is_shared: result.shared,
        shares_count: result.shares_count,
      }));

      setShareNote("");
      setShareOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-900">
      <Navbar />

      <main className="flex flex-col gap-4 items-center mt-15 py-4">
        <SinglePostCard
          post={post}
          shareOpen={shareOpen}
          shareNote={shareNote}
          setShareNote={setShareNote}
          onLike={handleLike}
          onShareToggle={handleShareToggle}
          onShareSubmit={handleShareSubmit}
        />

        <Comments
          postId={postId}
          type="main"
        />
      </main>
    </div>
  );
};

export default SinglePost;