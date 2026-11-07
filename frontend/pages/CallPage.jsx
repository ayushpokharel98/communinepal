import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Volume2, X } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import useWebRTC from "../services/useWebRTC";
import CallAvatar from "../components/Call/CallAvatar";
import {
    clearCallSession,
    formatDuration,
    getDisplayName,
    markCallSessionActive,
} from "../services/callUtils";

const WS_BASE_URL =
    import.meta.env.VITE_WS_BASE_URL ||
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000`;

const RING_TIMEOUT_MS = 45000;
const AUTO_CLOSE = new Set(["ended", "declined", "cancelled", "no_answer"]);

const parseJSON = (value) => {
    try { return JSON.parse(value); } catch { return null; }
};

const readInit = () => {
    const p = new URLSearchParams(window.location.search);
    const mode = p.get("mode");

    if (mode === "outgoing") {
        const callType = p.get("type");
        const conversationId = p.get("conversation");
        if (!conversationId || !["audio", "video"].includes(callType)) return null;
        return { mode, conversationId, callType, peer: parseJSON(p.get("peer")), call: null };
    }
    if (mode === "incoming") {
        const call = parseJSON(p.get("call"));
        if (!call?.id) return null;
        return { mode, call, callType: call.call_type, peer: call.initiator };
    }
    return null;
};

const getEndCopy = (ending, name) => {
    switch (ending?.reason) {
        case "declined":
            return { title: "Call declined", sub: `${name} isn't available right now.` };
        case "cancelled":
            return { title: "Call cancelled", sub: `${name} cancelled the call.` };
        case "no_answer":
            return { title: "No answer", sub: `${name} didn't pick up.` };
        case "failed":
            return { title: "Connection lost", sub: "The call couldn't stay connected. Check your network and try again." };
        case "error":
            return { title: "Couldn't start the call", sub: ending.message || "Something went wrong." };
        default:
            return { title: "Call ended", sub: null };
    }
};

const ControlButton = ({ onClick, off, label, children }) => (
    <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            off ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-white/10 text-white hover:bg-white/20"
        }`}
    >
        {children}
    </button>
);

const CallPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const userId = user?.user?.id;
    const [init] = useState(readInit);

    const [phase, setPhase] = useState("starting"); // starting | ringing | connecting | connected | ended
    const [ending, setEnding] = useState(null);
    const [notice, setNotice] = useState(null);
    const [seconds, setSeconds] = useState(0);
    const [audioBlocked, setAudioBlocked] = useState(false);

    const phaseRef = useRef("starting");
    const callRef = useRef(init?.call || null);
    const socketRef = useRef(null);
    const offerSentRef = useRef(false);
    const finishedRef = useRef(false);
    const startedAtRef = useRef(null);
    const handlerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteMediaRef = useRef(null);

    const sendSignal = useCallback((message) => {
        const socket = socketRef.current;
        const call = callRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN || !call?.id) return;
        socket.send(JSON.stringify({ ...message, call_id: call.id }));
    }, []);

    const rtc = useWebRTC(sendSignal);
    const rtcRef = useRef(rtc);
    rtcRef.current = rtc;

    // These helpers only touch refs and state setters, so the copies captured by
    // the socket effect below are safe even though they're recreated each render.
    const updatePhase = (next) => {
        phaseRef.current = next;
        setPhase(next);
    };

    const send = (data) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return false;
        socket.send(JSON.stringify(data));
        return true;
    };

    const finish = (reason, message = null) => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        rtcRef.current.cleanup();
        const socket = socketRef.current;
        socketRef.current = null;
        socket?.close();
        setEnding({ reason, message });
        updatePhase("ended");
    };

    const handleMessage = async (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }

        // The call tab shares the user's socket group with other tabs; ignore other calls.
        if (data.call_id && callRef.current && data.call_id !== callRef.current.id) return;

        const api = rtcRef.current;
        try {
            switch (data.type) {
                case "outgoing_call":
                    callRef.current = data.call;
                    updatePhase("ringing");
                    break;
                case "call_accepted":
                    updatePhase("connecting");
                    break;
                case "ready": // callee finished setting up: now it's safe to send the offer
                    if (offerSentRef.current) break;
                    offerSentRef.current = true;
                    await api.startCall(init.callType);
                    break;
                case "offer":
                    await api.handleOffer(data.description, init.callType);
                    break;
                case "answer":
                    await api.handleAnswer(data.description);
                    break;
                case "ice_candidate":
                    await api.handleIceCandidate(data.candidate);
                    break;
                case "call_rejected":
                    finish("declined");
                    break;
                case "call_cancelled":
                    finish("cancelled");
                    break;
                case "call_ended":
                    finish("ended");
                    break;
                case "error":
                    if (phaseRef.current === "connected") setNotice(data.message);
                    else finish("error", data.message);
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error("Call event handling failed:", err);
            setNotice("Something went wrong while connecting.");
        }
    };
    handlerRef.current = handleMessage;

    const hangUp = () => {
        const call = callRef.current;
        const current = phaseRef.current;

        if (call) {
            if (init.mode === "incoming" && current === "starting") {
                send({ type: "reject_call", call_id: call.id });
            } else if (init.mode === "outgoing" && current === "ringing") {
                send({ type: "cancel_call", call_id: call.id });
            } else if (current === "connecting" || current === "connected") {
                send({ type: "end_call", call_id: call.id });
            }
        }
        finish("ended");
    };

    const isEnded = phase === "ended";

    // Heartbeat so app tabs know a call is live (see callUtils).
    useEffect(() => {
        if (!init || isEnded) return;
        markCallSessionActive();
        const id = setInterval(markCallSessionActive, 2000);
        window.addEventListener("pagehide", clearCallSession);
        return () => {
            clearInterval(id);
            window.removeEventListener("pagehide", clearCallSession);
            clearCallSession();
        };
    }, [init, isEnded]);

    // Signaling socket. ?role=call lets the server end the call if this tab closes.
    useEffect(() => {
        if (!init || !userId) return;

        const socket = new WebSocket(`${WS_BASE_URL.replace(/\/$/, "")}/ws/calls/?role=call`);
        socketRef.current = socket;

        socket.onopen = async () => {
            if (socketRef.current !== socket) return;

            try {
                await rtcRef.current.prepareCall(init.callType); // permissions + peer connection
            } catch {
                if (init.mode === "incoming" && callRef.current) {
                    send({ type: "reject_call", call_id: callRef.current.id });
                }
                const device = init.callType === "video" ? "microphone or camera" : "microphone";
                finish("error", `We couldn't access your ${device}. Allow access in your browser and try again.`);
                return;
            }

            if (finishedRef.current) { // user hung up while the permission prompt was open
                rtcRef.current.cleanup();
                return;
            }
            if (socketRef.current !== socket) return;

            if (init.mode === "outgoing") {
                send({ type: "start_call", conversation_id: init.conversationId, call_type: init.callType });
            } else {
                send({ type: "accept_call", call_id: callRef.current.id });
                sendSignal({ type: "ready" });
                updatePhase("connecting");
            }
        };

        socket.onmessage = (event) => {
            if (socketRef.current !== socket) return;
            handlerRef.current?.(event);
        };

        socket.onclose = () => {
            if (socketRef.current !== socket) return; // stale socket
            socketRef.current = null;
            if (phaseRef.current === "starting") finish("error", "Couldn't reach the call server.");
            else finish("failed");
        };

        return () => {
            if (socketRef.current === socket) socketRef.current = null;
            socket.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // No answer after 45s: cancel the call.
    useEffect(() => {
        if (phase !== "ringing" || init?.mode !== "outgoing") return;
        const t = setTimeout(() => {
            if (callRef.current) send({ type: "cancel_call", call_id: callRef.current.id });
            finish("no_answer");
        }, RING_TIMEOUT_MS);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // Peer connection state -> call phase.
    useEffect(() => {
        if (isEnded) return;
        if (rtc.connectionState === "connected") updatePhase("connected");
        if (rtc.connectionState === "failed") {
            if (callRef.current) send({ type: "end_call", call_id: callRef.current.id });
            finish("failed");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rtc.connectionState]);

    // Surface WebRTC errors that happen mid-call.
    useEffect(() => {
        if (rtc.error && phaseRef.current === "connected") setNotice(rtc.error);
    }, [rtc.error]);

    // Duration timer.
    useEffect(() => {
        if (phase !== "connected") return;
        startedAtRef.current ??= Date.now();
        const id = setInterval(
            () => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000)),
            1000
        );
        return () => clearInterval(id);
    }, [phase]);

    // Attach streams.
    useEffect(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = rtc.localStream;
    }, [rtc.localStream]);

    useEffect(() => {
        const el = remoteMediaRef.current;
        if (!el) return;
        el.srcObject = rtc.remoteStream;
        if (rtc.remoteStream) {
            el.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
        }
    }, [rtc.remoteStream]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(t);
    }, [notice]);

    useEffect(() => {
        if (!ending || !AUTO_CLOSE.has(ending.reason)) return;
        const t = setTimeout(() => window.close(), 3000);
        return () => clearTimeout(t);
    }, [ending]);

    const peer = init?.peer;
    const name = getDisplayName(peer);

    useEffect(() => {
        if (init) document.title = `Call · ${name}`;
    }, [init, name]);

    if (!init) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 text-white">
                <p className="text-gray-400">There's no call to show here.</p>
                <button
                    onClick={() => navigate("/message")}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900"
                >
                    Back to messages
                </button>
            </div>
        );
    }

    const isVideoCall = init.callType === "video";
    const hasRemoteVideo =
        isVideoCall && !!rtc.remoteStream?.getVideoTracks().some((t) => t.readyState === "live");
    const reconnecting = phase === "connected" && rtc.connectionState === "disconnected";

    const statusText = reconnecting
        ? "Reconnecting…"
        : {
            starting: init.mode === "outgoing" ? "Starting call…" : "Joining call…",
            ringing: "Calling…",
            connecting: "Connecting…",
            connected: formatDuration(seconds),
            ended: "Call ended",
        }[phase];

    const dotClass = reconnecting
        ? "bg-amber-400 animate-pulse"
        : phase === "connected"
            ? "bg-emerald-400"
            : "bg-gray-400 animate-pulse";

    const subtitle =
        phase === "ringing" ? "Ringing…"
        : phase === "connected" ? (isVideoCall ? "Waiting for video…" : "Voice call in progress")
        : "Connecting…";

    const endCopy = getEndCopy(ending, name);

    return (
        <div className="fixed inset-0 select-none overflow-hidden bg-gray-950 text-white">
            {/* Ambient background */}
            {peer?.profile_picture && (
                <img
                    src={`${import.meta.env.VITE_BASE_URL}${peer.profile_picture}`}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-3xl"
                />
            )}
            <div
                className="absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(17,24,39,0.2), rgba(3,7,18,0.95) 70%)" }}
            />

            {/* Remote media (also plays audio for voice calls) */}
            <video
                ref={remoteMediaRef}
                autoPlay
                playsInline
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                    hasRemoteVideo ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />
            {hasRemoteVideo && (
                <>
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-40"
                        style={{ background: "linear-gradient(to bottom, rgba(3,7,18,0.7), transparent)" }}
                    />
                    <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
                        style={{ background: "linear-gradient(to top, rgba(3,7,18,0.8), transparent)" }}
                    />
                    <p className="absolute bottom-28 left-6 z-10 text-lg font-semibold drop-shadow">{name}</p>
                </>
            )}

            {/* Header */}
            <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-gray-900/60 py-1.5 pl-3 pr-4 text-sm backdrop-blur-md">
                    <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                    <span className="tabular-nums text-gray-100">{statusText}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-900/60 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-md">
                    {isVideoCall ? <Video size={13} /> : <Phone size={13} />}
                    {isVideoCall ? "Video call" : "Voice call"}
                </div>
            </header>

            {/* Stage (no remote video yet / voice call) */}
            {!hasRemoteVideo && !isEnded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <div className="relative flex h-44 w-44 items-center justify-center">
                        {phase !== "connected" ? (
                            <>
                                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/15" />
                                <span className="absolute -inset-5 animate-pulse rounded-full border border-emerald-500/20" />
                            </>
                        ) : (
                            <span className="absolute -inset-2 rounded-full ring-2 ring-emerald-400/40" />
                        )}
                        <CallAvatar
                            user={peer}
                            className="relative h-44 w-44 shadow-2xl ring-4 ring-gray-800/80"
                            textClass="text-6xl"
                            include_url={false}
                        />
                    </div>
                    <h1 className="mt-8 text-2xl font-semibold">{name}</h1>
                    <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
                </div>
            )}

            {/* Local preview */}
            {isVideoCall && !isEnded && (
                <div className="absolute bottom-28 right-4 z-20 aspect-[3/4] w-28 overflow-hidden rounded-2xl border border-white/15 bg-gray-800 shadow-2xl shadow-black/50 sm:aspect-video sm:w-44">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover [transform:scaleX(-1)]"
                    />
                    {!rtc.cameraEnabled && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gray-800 text-gray-300">
                            <VideoOff size={22} />
                            <span className="text-[11px]">Camera off</span>
                        </div>
                    )}
                </div>
            )}

            {/* Banners */}
            {audioBlocked && !isEnded && (
                <button
                    onClick={() =>
                        remoteMediaRef.current?.play().then(() => setAudioBlocked(false)).catch(() => {})
                    }
                    className="absolute left-1/2 top-32 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 shadow-lg"
                >
                    <Volume2 size={16} /> Tap to enable audio
                </button>
            )}
            {notice && !isEnded && (
                <div className="absolute left-1/2 top-20 z-20 flex w-[90%] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/30 bg-gray-900/90 px-4 py-3 text-sm text-red-200 shadow-xl backdrop-blur">
                    <AlertCircle size={18} className="shrink-0 text-red-400" />
                    <span className="flex-1">{notice}</span>
                    <button onClick={() => setNotice(null)} aria-label="Dismiss" className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Controls */}
            {!isEnded && (
                <footer className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-6">
                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-gray-900/70 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                        <ControlButton
                            onClick={rtc.toggleMicrophone}
                            off={!rtc.microPhoneEnabled}
                            label={rtc.microPhoneEnabled ? "Mute microphone" : "Unmute microphone"}
                        >
                            {rtc.microPhoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                        </ControlButton>

                        {isVideoCall && (
                            <ControlButton
                                onClick={rtc.toggleCamera}
                                off={!rtc.cameraEnabled}
                                label={rtc.cameraEnabled ? "Turn camera off" : "Turn camera on"}
                            >
                                {rtc.cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                            </ControlButton>
                        )}

                        <button
                            onClick={hangUp}
                            aria-label="End call"
                            title="End call"
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 transition-colors hover:bg-red-500"
                        >
                            <PhoneOff size={24} />
                        </button>
                    </div>
                </footer>
            )}

            {/* Ended */}
            {isEnded && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-gray-700/70 bg-gray-900 p-8 text-center shadow-2xl">
                        <CallAvatar user={peer} className="mx-auto h-20 w-20" textClass="text-2xl" include_url={false}/>
                        <h2 className="mt-5 text-xl font-semibold">{endCopy.title}</h2>
                        {endCopy.sub && <p className="mt-1.5 text-sm text-gray-400">{endCopy.sub}</p>}
                        {seconds > 0 && (
                            <p className="mt-3 text-xs tabular-nums text-gray-500">
                                Duration {formatDuration(seconds)}
                            </p>
                        )}
                        <div className="mt-7 flex gap-3">
                            <button
                                onClick={() => window.close()}
                                className="flex-1 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                            >
                                Close tab
                            </button>
                            <button
                                onClick={() => navigate("/message")}
                                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
                            >
                                Messages
                            </button>
                        </div>
                        {AUTO_CLOSE.has(ending?.reason) && (
                            <p className="mt-4 text-xs text-gray-500">This tab will close automatically.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallPage;