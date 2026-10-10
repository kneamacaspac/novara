import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useObjectUrl } from "../lib/useObjectUrl";

// Every cover sits in a slot of the same width. The whole strip slides sideways,
// and the selected cover grows with a scale transform, so everything animates smoothly.
const SLOT = "(15vh + 2.9vw)"; // width of one cover plus the gap after it

function Item({ book, active, onClick }) {
  const url = useObjectUrl(book.cover);
  return (
    <button
      onClick={onClick}
      className="flex w-[15vh] flex-col items-center gap-[1vh]"
    >
      <div
        className={`aspect-[2/3] w-full origin-bottom overflow-hidden rounded-md bg-white/10 shadow-2xl transition duration-500 ease-out motion-reduce:transition-none ${
          active ? "scale-[1.2] opacity-100" : "scale-100 opacity-80"
        }`}
      >
        {url ? (
          <img
            src={url}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center p-2 text-center text-xs">
            {book.title}
          </div>
        )}
      </div>
      {/* w-0 min-w-full keeps long titles from making the slot wider than its cover */}
      <span
        className={`w-0 min-w-full truncate text-center text-[clamp(0.6rem,1.2vh,0.8rem)] transition-colors duration-500 ${
          active ? "text-white" : "text-white/70"
        }`}
      >
        {book.title}
      </span>
    </button>
  );
}

export default function CoverCarousel({ books, index, setIndex }) {
  const total = books.length;
  const go = (n) => setIndex(Math.min(total - 1, Math.max(0, n)));

  // Only covers near the selected one are drawn (keeps big libraries light)
  const visible = books
    .map((b, i) => ({ b, i }))
    .filter(({ i }) => i >= index - 2 && i <= index + 10);

  // Left and right arrow keys
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total]);

  return (
    <div className="relative flex h-[37vh] shrink-0 flex-col bg-black/30">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* The strip: 11vh keeps the selected cover at the same spot as the mockup,
            and the previous cover peeks in from the left edge */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(calc(11vh - ${index} * ${SLOT}))` }}
        >
          {visible.map(({ b, i }) => (
            <div
              key={b.id}
              className="absolute bottom-[0.5vh]"
              style={{ left: `calc(${i} * ${SLOT})` }}
            >
              <Item book={b} active={i === index} onClick={() => go(i)} />
            </div>
          ))}
        </div>

        <button
          onClick={() => go(index - 1)}
          disabled={index <= 0}
          className="absolute left-[2.5%] top-[38%] grid h-[6vh] min-h-10 w-[6vh] min-w-10 place-items-center rounded-full bg-white/25 backdrop-blur-md transition hover:bg-white/35 disabled:opacity-30"
          title="Previous book"
        >
          <ChevronLeft size={28} />
        </button>

        <button
          onClick={() => go(index + 1)}
          disabled={index >= total - 1}
          className="absolute right-[2.5%] top-[38%] grid h-[6vh] min-h-10 w-[6vh] min-w-10 place-items-center rounded-full bg-white/25 backdrop-blur-md transition hover:bg-white/35 disabled:opacity-30"
          title="Next book"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between pb-[1.8vh] pl-[11vw] pr-[2.5vw] pt-[1.2vh]">
        <div className="flex items-center gap-2 text-white/80">
          <button onClick={() => go(index - 1)} title="Previous book">
            <ChevronLeft size={16} />
          </button>
          {[-2, -1, 0, 1, 2].map((o) => {
            const i = index + o;
            const exists = i >= 0 && i < total;
            return (
              <button
                key={o}
                onClick={() => exists && go(i)}
                className={`rounded-full transition-all duration-300 ${
                  o === 0
                    ? "h-2 w-2 bg-white"
                    : exists
                      ? "h-1.5 w-1.5 bg-white/45"
                      : "h-1.5 w-1.5 bg-white/15"
                }`}
              />
            );
          })}
          <button onClick={() => go(index + 1)} title="Next book">
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="text-[clamp(0.7rem,1.4vh,0.95rem)] font-semibold">
          {index + 1}/{total}
        </span>
      </div>
    </div>
  );
}
