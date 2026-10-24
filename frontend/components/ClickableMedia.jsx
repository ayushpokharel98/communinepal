import { useEffect, useState } from "react";
import { X, Maximize2, Play } from "lucide-react";

const ClickableMedia = ({ file }) => {
    const BASE_URL = import.meta.env.VITE_BASE_URL || "";
    const [isOpen, setIsOpen] = useState(false);

    const mediaSrc = BASE_URL+file.media_url

    const isPhoto = file.media_type === "photo";

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <>

            <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label={`View ${isPhoto ? "image" : "video"}`}
                className="group relative block size-24 shrink-0 overflow-hidden rounded-xl border border-gray-700/70 bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition duration-300 hover:scale-105"
            >
                {isPhoto ? (
                    <img
                        src={mediaSrc}
                        alt="Shared image"
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <video
                        src={mediaSrc}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                    />
                )}

                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition hover:bg-black/35 w-full h-full opacity-0 hover:opacity-100">
                    {isPhoto ? (
                        <Maximize2
                            size={20}
                            className=""
                        />
                    ) : (
                        <span className="flex size-9 items-center justify-center rounded-full bg-black/60">
                            <Play size={19} fill="currentColor" />
                        </span>
                    )}
                </span>
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={isPhoto ? "Image viewer" : "Video player"}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-lg sm:p-8"
                >

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close media viewer"
                        className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-lg transition hover:rotate-90 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6"
                    >
                        <X size={22} />
                    </button>

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex max-h-full max-w-full items-center justify-center"
                    >
                        {isPhoto ? (
                            <img
                                src={mediaSrc}
                                alt="Shared image enlarged"
                                className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
                            />
                        ) : (
                            <video
                                src={mediaSrc}
                                controls
                                autoPlay
                                playsInline
                                className="max-h-[85vh] max-w-[92vw] rounded-lg bg-black shadow-2xl"
                            >
                                Your browser does not support video playback.
                            </video>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ClickableMedia;
