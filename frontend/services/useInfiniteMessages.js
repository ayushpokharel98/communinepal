import { useState, useRef, useCallback, useEffect } from "react";
import chatService from "./chatService";
// Pulls the `cursor` query param out of a DRF pagination URL like
// "http://host/chat/messages/3/?cursor=cD0yMDI0..."
const extractCursor = (url) => {
    if (!url) return null;
    try {
        return new URL(url).searchParams.get("cursor");
    } catch {
        return null;
    }
};

/**
 * Manages messages for a single conversation.
 * - Messages are stored oldest -> newest (so they render top to bottom naturally).
 * - `loadOlder` fetches the next cursor page (older messages) and prepends them.
 * - `topSentinelRef` should be attached to a div at the top of the message list;
 *   an IntersectionObserver fires `loadOlder` when it scrolls into view.
 */
export default function useInfiniteMessages(conversationId) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);

    const nextCursorRef = useRef(null);
    const containerRef = useRef(null); // scroll container, set by ChatWindow
    const topSentinelRef = useRef(null);
    const observerRef = useRef(null);

    const reset = useCallback(() => {
        setMessages([]);
        setHasMore(true);
        nextCursorRef.current = null;
        setInitialLoading(true);
    }, []);

    const loadInitial = useCallback(async () => {
        if (!conversationId) return;
        setInitialLoading(true);
        try {
            const data = await chatService.getMessages(conversationId);
            const results = data.results ?? data;
            // backend returns newest-first; reverse for oldest -> newest rendering
            setMessages([...results].reverse());
            nextCursorRef.current = extractCursor(data.next);
            setHasMore(Boolean(data.next));
        } finally {
            setInitialLoading(false);
        }
    }, [conversationId]);

    const loadOlder = useCallback(async () => {
        if (!conversationId || loading || !hasMore || !nextCursorRef.current) return;
        setLoading(true);

        // preserve scroll position: remember height before prepend
        const el = containerRef.current;
        const prevHeight = el ? el.scrollHeight : 0;

        try {
            const data = await chatService.getMessages(conversationId, nextCursorRef.current);
            const results = data.results ?? data;
            setMessages((prev) => [...[...results].reverse(), ...prev]);
            nextCursorRef.current = extractCursor(data.next);
            setHasMore(Boolean(data.next));

            requestAnimationFrame(() => {
                if (el) {
                    const newHeight = el.scrollHeight;
                    el.scrollTop = newHeight - prevHeight;
                }
            });
        } finally {
            setLoading(false);
        }
    }, [conversationId, loading, hasMore]);

    // (re)load whenever the conversation changes
    useEffect(() => {
        reset();
        loadInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    // wire up IntersectionObserver on the top sentinel
    useEffect(() => {
        if (!topSentinelRef.current) return;

        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadOlder();
                }
            },
            { root: containerRef.current, threshold: 0.1 }
        );
        observerRef.current.observe(topSentinelRef.current);

        return () => observerRef.current?.disconnect();
    }, [loadOlder, messages.length === 0]);

    const addMessage = useCallback((message) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    const updateMessage = useCallback((id, patch) => {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    }, []);

    const removeMessage = useCallback((id) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    return {
        messages,
        loading,
        initialLoading,
        hasMore,
        containerRef,
        topSentinelRef,
        addMessage,
        updateMessage,
        removeMessage,
    };
}