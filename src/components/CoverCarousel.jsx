import { ChevronLeft, ChevronRight } from "lucide-react";
import { useObjectUrl } from "../lib/useObjectUrl";

function Item({ book, big, onClick }) {
  const url = useObjectUrl(book.cover);
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-[1vh]"
    >
      <div
        className={`aspect-[2/3] overflow-hidden rounded-md bg-white/10 shadow-2xl ${big ? "h-[27vh]" : "h-[22.5vh]"}`}
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
      {/* w-0 min-w-full keeps long titles from making the item wider than its cover */}
      <span
        className={`w-0 min-w-full truncate text-center text-[clamp(0.6rem,1.2vh,0.8rem)] ${big ? "text-white" : "text-white/70"}`}
      >
        {book.title}
      </span>
    </button>
  );
}

export default function CoverCarousel({ books, index, setIndex }) {
  const total = books.length;
  const go = (n) => setIndex(Math.min(total - 1, Math.max(0, n)));

  // One book before the selected one (cropped), the selected one, and up to five after it
  const visible = books
    .map((b, i) => ({ b, i }))
    .filter(({ i }) => i >= index - 1 && i <= index + 5);

  return (
    <div className="relative flex h-[37vh] shrink-0 flex-col bg-black/30">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-[2.9vw]">
          {visible.map(({ b, i }) => {
            // The book before the selected one is pulled left so it shows only partly.
            // With no previous book, push the selected one right to keep the same position.
            let spacing = "";
            if (i === index - 1) spacing = "-ml-[8vh]";
            if (i === index && index === 0) spacing = "ml-[11vh]";
            return (
              <div key={b.id} className={spacing}>
                <Item book={b} big={i === index} onClick={() => go(i)} />
              </div>
            );
          })}
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

      <div className="flex shrink-0 items-center justify-end pb-[1.8vh] pl-[11vw] pr-[2.5vw] pt-[1.2vh]">
        <span className="text-[clamp(0.7rem,1.4vh,0.95rem)] font-semibold">
          {index + 1}/{total}
        </span>
      </div>
    </div>
  );
}
