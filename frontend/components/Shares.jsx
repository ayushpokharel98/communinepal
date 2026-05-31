import { Construction, Repeat2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MediaCarousel from "./Posts/MediaCarousel";
import Loading from "./Loading";
import { useToast } from "../contexts/ToastContext";
import postService from "../services/postService";
import { Link } from "react-router-dom";
import Comments from "./Comments";
import timeAgo from "../services/timeAgo";

const Shares = ({ userId }) => {
  const [sharedPosts, setSharedPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();
  const endRef = useRef(null);
  const isFetchingRef = useRef(false);

  const fetchSharedPosts = async (cursor = null) => {
    if (isFetchingRef.current || (!hasMore && cursor != null)) return;

    isFetchingRef.current = true;

    try {
      const res = await postService.getShares(userId, cursor);
      const newPosts = res.results ?? res;
      const newCursor = res.next ? new URL(res.next).searchParams.get("cursor") : null;

      setSharedPosts((prev) => cursor === null ? newPosts : [...prev, ...newPosts]);
      setNextCursor(newCursor);
      setHasMore(!!newCursor);
    } catch (err) {
      console.error(err);
      error("Error retrieving shared posts, please try again later!");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    setSharedPosts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchSharedPosts(null);
  }, [userId]);

  useEffect(() => {
    if (!endRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
        fetchSharedPosts(nextCursor);
      }
    }, { threshold: 0.1 });

    observer.observe(endRef.current);

    return () => observer.disconnect();
  }, [hasMore, nextCursor]);

  if (loading) return <Loading />;

  return (
    <>
      {!sharedPosts.length ? (
        <div className="w-full flex justify-center items-center text-gray-400 mt-5">
          No shared posts yet.
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 py-2 text-white">
          {sharedPosts.map((share) => (
            <div
              key={share.id}
              className="w-full max-w-xl bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <img
                  src={share.shared_author_profile_picture}
                  alt={share.shared_author_username}
                  className="rounded-full object-cover shrink-0 size-12"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Repeat2 size={14} className="text-blue-400 shrink-0" />
                    <p className="font-medium text-white text-sm truncate">
                      {share.shared_author_username}
                    </p>
                    <span className="text-xs text-gray-500">shared</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {timeAgo(share.shared_at)}
                    <span className="mx-1">·</span>
                    {new Date(share.shared_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {share.note && (
                <p className="px-4 pb-3 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {share.note}
                </p>
              )}

              {/* Original post — nested card */}
              <div className="mx-3 mb-3 rounded-xl border border-gray-600 bg-gray-900 overflow-hidden">
                {/* Original post header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={share.post.author_profile_picture}
                    alt={share.post.author_username}
                    className="rounded-full object-cover shrink-0 size-9"
                  />
                  <div className="flex flex-col min-w-0">
                    <Link to={`/profile/${share.post.author_username}`} className="font-medium text-white text-sm truncate hover:underline">
                      {share.post.author_username}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {timeAgo(share.post.created_at)}
                      <span className="mx-1">·</span>
                      {new Date(share.post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Original post caption */}
                {share.post.caption && (
                  <p className="px-4 pb-3 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                    {share.post.caption}
                  </p>
                )}

                {/* Original post media */}
                {share.post.media?.length > 0 && (
                  <MediaCarousel media={share.post.media} />
                )}
              </div>
            </div>
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
    </>
  );
};

export default Shares;