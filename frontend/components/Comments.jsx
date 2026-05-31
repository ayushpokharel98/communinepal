import { useEffect, useRef, useState } from "react";
import { X, Send, CornerDownRight, MessageCircleMore } from "lucide-react";
import postService from "../services/postService";
import { useAuth } from "../contexts/AuthContext";
import Loading from "./Loading";
import { Link } from "react-router-dom";
import timeAgo from "../services/timeAgo";

function Avatar({ src, alt, size = "md" }) {
    const sizes = { sm: "size-7", md: "size-9" };
    return (
        <img
            src={src}
            alt={alt}
            className={`${sizes[size]} rounded-full object-cover shrink-0`}
        />
    );
}

function CommentItem({ comment, onReply, depth = 0 }) {
    const [showReplies, setShowReplies] = useState(false);
    const hasReplies = comment.replies?.length > 0;

    return (
        <div className={`flex flex-col gap-1 ${depth > 0 ? "pl-4 border-l border-gray-700" : ""}`}>
            <div className="flex gap-3">
                <Avatar src={comment.author_profile_picture} alt={comment.author_username} />
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="bg-gray-700/60 rounded-2xl rounded-tl-sm px-3.5 py-2">
                        <Link to={`/profile/${comment.author_username}`} className="text-sm font-semibold text-white leading-none mb-1 hover:underline">
                            {comment.author_username}
                        </Link>
                        <p className="text-sm text-gray-200 leading-relaxed wrap-break-word">
                            {comment.body}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mt-1 px-1">
                        <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
                        {depth === 0 && (
                            <button
                                onClick={() => onReply(comment)}
                                className="text-xs text-gray-400 hover:text-blue-400 transition-colors font-medium"
                            >
                                Reply
                            </button>
                        )}
                        {hasReplies && (
                            <button
                                onClick={() => setShowReplies((v) => !v)}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                            >
                                <CornerDownRight size={11} />
                                {showReplies ? "Hide" : `${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {hasReplies && showReplies && (
                <div className="ml-12 mt-1 flex flex-col gap-3">
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

const Comments = ({ postId, onClose }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [body, setBody] = useState("");
    const [replyingTo, setReplyingTo] = useState(null); // { id, author_username }
    const isFetchingRef = useRef(false);
    const endRef = useRef(null);
    const inputRef = useRef(null);
    const overlayRef = useRef(null);

    const fetchComments = async (cursor = null) => {
        if (isFetchingRef.current || (!hasMore && cursor !== null)) return;
        isFetchingRef.current = true;
        cursor ? setLoadingMore(true) : setLoading(true);

        try {
            const res = await postService.getComments(postId, cursor);            
            const newComments = res.results ?? res;
            const newCursor = res.next ? new URL(res.next).searchParams.get("cursor") : null;
            setComments((prev) => (cursor === null ? newComments : [...prev, ...newComments]));
            setNextCursor(newCursor);
            setHasMore(!!newCursor);
        } catch (err) {
            console.error(err);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchComments(null);
    }, [postId]);

    useEffect(() => {
        if (!endRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
                    fetchComments(nextCursor);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(endRef.current);
        return () => observer.disconnect();
    }, [hasMore, nextCursor]);

    const handleReply = (comment) => {        
        setReplyingTo(comment);
        setBody(`@${comment.author_username} `);
        inputRef.current?.focus();
    };

    const clearReply = () => {
        setReplyingTo(null);
        setBody("");
    };

    const handleSubmit = async () => {
        if (!body.trim() || submitting) return;
        setSubmitting(true);
        try {
            const newComment = await postService.createComment({
                postId,
                body: body.trim(),
                parentId: replyingTo?.id ?? null,
            });

            if (replyingTo) {
                // Nest the reply under its parent
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === replyingTo.id
                            ? { ...c, replies: [...(c.replies ?? []), newComment] }
                            : c
                    )
                );
            } else {
                setComments((prev) => [newComment, ...prev]);
            }

            clearReply();
        } catch (err) {
            console.error(err.response.data);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose?.();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            <div className="w-full sm:max-w-lg bg-gray-900 sm:rounded-2xl rounded-t-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
                    <h2 className="text-white font-semibold text-base">Comments</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loading />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
                            <MessageCircleMore size={32} className="opacity-40" />
                            <p className="text-sm">No comments yet. Be the first!</p>
                        </div>
                    ) : (
                        <>
                            {comments.map((comment) => (
                                <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
                            ))}
                            <div ref={endRef} className="py-1 flex justify-center">
                                {loadingMore && <Loading />}
                            </div>
                        </>
                    )}
                </div>

                <div className="border-t border-gray-700 px-4 py-3 shrink-0">
                    {/* Replying-to banner */}
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5 mb-2 text-xs text-gray-400">
                            <span>
                                Replying to{" "}
                                <span className="text-blue-400 font-medium">@{replyingTo.author_username}</span>
                            </span>
                            <button onClick={clearReply} className="text-gray-500 hover:text-white transition-colors">
                                <X size={13} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Avatar
                            src={user?.user?.profile_picture ?? user?.profile_picture}
                            alt="You"
                            size="sm"
                        />
                        <div className="flex-1 flex items-center bg-gray-800 border border-gray-600 rounded-2xl pr-1 pl-4 focus-within:border-blue-500 transition-colors">
                            <textarea
                                ref={inputRef}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                placeholder="Write a comment…"
                                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 resize-none outline-none py-2.5 max-h-28 leading-relaxed"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!body.trim() || submitting}
                                className="p-2 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                            >
                                {submitting ? (
                                    <Loading />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Comments;