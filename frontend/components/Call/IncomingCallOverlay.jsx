import { useEffect } from "react";
import { AlertCircle, Phone, PhoneOff, Video, X } from "lucide-react";
import { useCall } from "../../contexts/CallContext";
import CallAvatar from "./CallAvatar";
import { getDisplayName } from "../../services/callUtils";

const IncomingCallOverlay = () => {
    const { incomingCall, callError, acceptCall, rejectCall, clearCallError } = useCall();

    const peer = incomingCall?.peer;
    const isVideo = incomingCall?.call_type === "video";
    const name = getDisplayName(peer);

    useEffect(() => {
        if (!incomingCall) return;
        const previous = document.title;
        document.title = `📞 ${name} is calling…`;
        return () => { document.title = previous; };
    }, [incomingCall, name]);

    useEffect(() => {
        if (!callError) return;
        const t = setTimeout(clearCallError, 5000);
        return () => clearTimeout(t);
    }, [callError, clearCallError]);

    return (
        <>
            {incomingCall && (
                <div
                    role="alertdialog"
                    aria-label="Incoming call"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                >
                    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-gray-700/70 bg-gray-900 shadow-2xl shadow-black/50">
                        {peer?.profile_picture && (
                            <img
                                src={peer.profile_picture}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-2xl"
                            />
                        )}
                        <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(to bottom, rgba(17,24,39,0.2), rgba(17,24,39,0.95))" }}
                        />

                        <div className="relative px-8 pb-8 pt-10 text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                                {isVideo ? <Video size={13} /> : <Phone size={13} />}
                                Incoming {isVideo ? "video" : "voice"} call
                            </span>

                            <div className="relative mx-auto mt-8 flex h-32 w-32 items-center justify-center">
                                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                                <span className="absolute -inset-4 animate-pulse rounded-full border border-emerald-500/20" />
                                <CallAvatar
                                    user={peer}
                                    className="relative h-32 w-32 ring-4 ring-gray-800"
                                    textClass="text-5xl"
                                    include_url={true}
                                />
                            </div>

                            <h2 className="mt-6 truncate text-xl font-semibold text-white">{name}</h2>
                            {peer?.username && <p className="text-sm text-gray-400">@{peer.username}</p>}
                            <p className="mt-2 text-xs text-gray-500">The call opens in a new tab</p>

                            <div className="mt-8 flex justify-center gap-14">
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={rejectCall}
                                        aria-label="Decline call"
                                        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 transition hover:scale-105 hover:bg-red-500"
                                    >
                                        <PhoneOff size={24} />
                                    </button>
                                    <span className="text-xs text-gray-400">Decline</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={acceptCall}
                                        aria-label="Accept call"
                                        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition hover:scale-105 hover:bg-emerald-400"
                                    >
                                        {isVideo ? <Video size={24} /> : <Phone size={24} />}
                                    </button>
                                    <span className="text-xs text-gray-400">Accept</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {callError && (
                <div className="fixed left-1/2 top-4 z-[110] flex w-[90%] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/30 bg-gray-900 px-4 py-3 text-sm text-red-200 shadow-xl">
                    <AlertCircle size={18} className="shrink-0 text-red-400" />
                    <span className="flex-1">{callError}</span>
                    <button onClick={clearCallError} aria-label="Dismiss" className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            )}
        </>
    );
};

export default IncomingCallOverlay;