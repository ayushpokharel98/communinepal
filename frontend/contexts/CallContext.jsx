import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { isCallSessionActive, openCallWindow } from "../services/callUtils";

const CallContext = createContext(null);

const WS_BASE_URL =
    import.meta.env.VITE_WS_BASE_URL ||
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000`;

export const CallProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const shouldReconnectRef = useRef(true);
    const incomingRef = useRef(null);
    const handlerRef = useRef(null);

    const [connected, setConnected] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callError, setCallError] = useState(null);

    const clearCallError = useCallback(() => setCallError(null), []);

    const setIncoming = (call) => {
        incomingRef.current = call;
        setIncomingCall(call);
    };

    const sendEvent = (data) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            setCallError("Call connection is unavailable.");
            return false;
        }
        socket.send(JSON.stringify(data));
        return true;
    };

    const handleSocketMessage = (event) => {
        let data;
        try {
            data = JSON.parse(event.data);
        } catch {
            return;
        }

        switch (data.type) {
            case "incoming_call": {
                if (incomingRef.current?.id === data.call.id) break;
                if (incomingRef.current || isCallSessionActive()) {
                    sendEvent({ type: "reject_call", call_id: data.call.id }); // busy
                    break;
                }
                setIncoming({ ...data.call, peer: data.call.initiator });
                break;
            }
            case "call_cancelled":
            case "call_rejected":
            case "call_ended":
            case "call_handled": // accepted or rejected from another tab
                if (incomingRef.current?.id === data.call_id) setIncoming(null);
                break;
            default:
                break;
        }
    };
    handlerRef.current = handleSocketMessage;

    const startCall = useCallback((conversationId, callType, peer) => {
        if (!conversationId) {
            setCallError("Send a message first, then you can start a call.");
            return;
        }
        if (!["audio", "video"].includes(callType)) {
            setCallError("Invalid call type.");
            return;
        }
        if (incomingRef.current || isCallSessionActive()) {
            setCallError("You are already in a call.");
            return;
        }

        const opened = openCallWindow({
            mode: "outgoing",
            conversation: conversationId,
            type: callType,
            peer: JSON.stringify({
                id: peer?.id,
                username: peer?.username,
                full_name: peer?.full_name,
                profile_picture: peer?.profile_picture,
            }),
        });

        if (!opened) {
            setCallError("Your browser blocked the call tab. Allow pop-ups for this site and try again.");
        }
    }, []);

    const acceptCall = () => {
        const call = incomingRef.current;
        if (!call) return;

        const opened = openCallWindow({ mode: "incoming", call: JSON.stringify(call) });
        if (!opened) {
            setCallError("Your browser blocked the call tab. Allow pop-ups for this site and try again.");
            return;
        }
        setIncoming(null);
    };

    const rejectCall = () => {
        const call = incomingRef.current;
        if (!call) return;
        if (sendEvent({ type: "reject_call", call_id: call.id })) setIncoming(null);
    };

    useEffect(() => {
        if (!user?.user?.id) return;

        shouldReconnectRef.current = true;

        const connectSocket = () => {
            if (!shouldReconnectRef.current) return;
            const socket = new WebSocket(`${WS_BASE_URL.replace(/\/$/, "")}/ws/calls/`);
            socketRef.current = socket;

            socket.onopen = () => {
                if (socketRef.current !== socket) return;
                setConnected(true);
            };
            socket.onmessage = (event) => {
                if (socketRef.current !== socket) return;
                handlerRef.current?.(event);
            };
            socket.onclose = () => {
                if (socketRef.current !== socket) return; // stale socket (StrictMode / cleanup)
                socketRef.current = null;
                setConnected(false);
                if (shouldReconnectRef.current) {
                    reconnectTimerRef.current = setTimeout(connectSocket, 3000);
                }
            };
        };

        connectSocket();

        return () => {
            shouldReconnectRef.current = false;
            clearTimeout(reconnectTimerRef.current);
            const socket = socketRef.current;
            socketRef.current = null;
            socket?.close();
            setConnected(false);
        };
    }, [user?.user?.id]);

    const value = {
        connected,
        incomingCall,
        callError,
        startCall,
        acceptCall,
        rejectCall,
        clearCallError,
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used inside CallProvider");
    return context;
};