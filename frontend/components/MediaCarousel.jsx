import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MediaCarousel = ({ media }) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);
  const total = media.length;

  const go = (index) => setCurrent(Math.max(0, Math.min(index, total - 1)));

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) go(current + 1);
    if (dx > 40) go(current - 1);
    touchStartX.current = null;
  };

  if (!total) return null;

  return (
    <div className="relative overflow-hidden " onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Track */}
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {media.map((m) => (
          <div key={m.id} className="w-full shrink-0">
            {m.media_type === "photo" ? (
              <img src={m.file_url} alt="" className="w-full h-72 object-contain" />
            ) : (
              <video src={m.file_url} controls className="w-full h-72 object-cover" />
            )}
          </div>
        ))}
      </div>

      {/* Counter badge */}
      {total > 1 && (
        <span className="absolute top-2.5 right-3 bg-black/55 text-white text-xs px-2 py-0.5 rounded-full">
          {current + 1} / {total}
        </span>
      )}

      {/* Prev / Next */}
      {current > 0 && (
        <button
          onClick={() => go(current - 1)}
          aria-label="Previous"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {current < total - 1 && (
        <button
          onClick={() => go(current + 1)}
          aria-label="Next"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;