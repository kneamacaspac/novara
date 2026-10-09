import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Notebook } from "lucide-react";
import {
  useStatsData,
  computeStreak,
  recentBooks,
} from "../services/statsService";
import { toggleFavorite } from "../services/bookService";
import { useObjectUrl } from "../lib/useObjectUrl";
import { dashCard } from "../lib/ui";
import ClockCard from "../components/ClockCard";
import MiniCalendar from "../components/MiniCalendar";
import CoverCarousel from "../components/CoverCarousel";

// '2020-09-01' becomes 'September 1, 2020'; anything else is shown as typed
function formatDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (!/^\d{4}-\d{2}-\d{2}/.test(s) || isNaN(d)) return s;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function RecentRow({ rank, book, hours, last }) {
  const cover = useObjectUrl(book.cover);
  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 items-center gap-3 ${last ? "" : "border-b border-white/15"}`}
    >
      <span className="w-5 shrink-0 text-center text-[clamp(0.65rem,1.3vh,0.9rem)] text-white/80">
        {String(rank).padStart(2, "0")}
      </span>
      <div className="aspect-[2/3] h-[5.4vh] shrink-0 overflow-hidden rounded bg-white/10">
        {cover && (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-[clamp(0.7rem,1.5vh,1rem)] font-semibold">
        {book.title}
      </span>
      <span className="shrink-0 text-[clamp(0.65rem,1.4vh,0.9rem)] font-semibold text-white/80">
        {hours} Hr
      </span>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const data = useStatsData();
  const [index, setIndex] = useState(0);

  const list = data
    ? [...data.books].sort((a, b) => b.addedAt - a.addedAt)
    : [];
  const current = list.length ? list[Math.min(index, list.length - 1)] : null;
  const cover = useObjectUrl(current ? current.cover : null);

  if (!data) return null;

  if (!current) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Welcome to Novara</h1>
          <p className="mb-4 text-white/60">
            Add your first book to get started.
          </p>
          <button
            onClick={() => nav("/library")}
            className="rounded-xl bg-accent px-5 py-3 font-medium"
          >
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  const { books, progress, sessions } = data;
  const pct =
    (progress.find((p) => p.bookId === current.id) || {}).percent || 0;
  const readDays = new Set(
    sessions.filter((s) => s.minutes >= 1).map((s) => s.date),
  );
  const rows = recentBooks(books, progress, sessions, 3);
  const round =
    "grid aspect-square h-[5.3vh] min-h-10 place-items-center rounded-full bg-[#4a4a4a] hover:bg-[#5a5a5a]";

  return (
    // h-full + overflow-hidden: the page is exactly one screen tall, so there is never a scrollbar
    <div className="grid h-full grid-cols-[minmax(0,1fr)_clamp(15rem,25vw,23rem)] gap-[1.5vw] overflow-hidden bg-[#0C0C0C] pr-[1.2vw]">
      {/* LEFT: book details on top, cover carousel at the bottom */}
      <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
        {cover && (
          <>
            <img
              src={cover}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-md"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/40" />
          </>
        )}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-hidden pl-[clamp(1.5rem,4.2vw,4rem)]">
          <h1 className="line-clamp-2 text-[clamp(1.75rem,5.5vh,3.75rem)] font-bold leading-[1.1]">
            {current.title}
          </h1>
          <p className="mt-[1.2vh] text-[clamp(0.9rem,2.3vh,1.5rem)]">
            by {current.author || "Unknown author"}
          </p>
          <p className="mt-[2.2vh] line-clamp-4 max-w-[41rem] text-[clamp(0.7rem,1.35vh,0.9rem)] leading-snug text-white/90">
            {current.synopsis}
          </p>
          <p className="mt-[5vh] text-[clamp(0.7rem,1.4vh,0.95rem)]">
            Genre: {current.genre}
          </p>
          <p className="mt-[2.5vh] text-[clamp(0.7rem,1.4vh,0.95rem)]">
            {current.published
              ? `First published ${formatDate(current.published)}`
              : ""}
            {current.published && current.pages ? " | " : ""}
            {current.pages ? `${current.pages} pages` : ""}
          </p>

          <div className="mt-[3.5vh] flex items-center gap-3">
            {/* The darker part of the button shows how far you have read */}
            <button
              onClick={() => nav(`/read/${current.id}`)}
              className="h-[5.3vh] min-h-10 w-[clamp(9rem,15.3vw,14rem)] rounded-full text-[clamp(0.8rem,1.7vh,1.1rem)]"
              style={{
                background: `linear-gradient(to right, #4a4a4a ${pct * 100}%, #5a5a5a ${pct * 100}%)`,
              }}
            >
              Continue Reading
            </button>
            <button
              onClick={() => toggleFavorite(current.id)}
              className={round}
              title="Favorite"
            >
              <Heart
                size={22}
                fill={current.favorite ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={() => nav("/notebook")}
              className={round}
              title="Notebook"
            >
              <Notebook size={22} />
            </button>
          </div>
        </div>

        <div className="relative z-10">
          <CoverCarousel books={list} index={index} setIndex={setIndex} />
        </div>
      </section>

      {/* RIGHT: four cards that share the screen height (1.5 : 1 : 2.5 : 2.9) */}
      <aside
        className="grid min-h-0 gap-[1.5vh] py-[2.5vh] bg-[#0C0C0C]"
        style={{
          gridTemplateRows:
            "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 2.5fr) minmax(0, 2.9fr)",
        }}
      >
        <ClockCard />

        <div className={`${dashCard} flex min-w-0 items-center justify-center px-[6%]`}>
          <p className="text-center text-[clamp(0.8rem,1.8vh,1rem)] leading-snug">
            Your Reading Streak:{" "}
            <b className="font-bold">{computeStreak(sessions)}</b> 🔥
          </p>
        </div>

        <div
          className={`${dashCard} flex min-w-0 flex-col px-[6%] pb-[0.8vh] pt-[2vh]`}
        >
          <h3 className="mb-[0.5vh] text-[clamp(0.8rem,1.7vh,1.1rem)] font-bold">
            Recent Books
          </h3>
          {rows.length === 0 && (
            <p className="text-sm text-white/50">Nothing read yet.</p>
          )}
          {rows.map((r, i) => (
            <RecentRow
              key={r.book.id}
              rank={i + 1}
              book={r.book}
              hours={r.hours}
              last={i === rows.length - 1}
            />
          ))}
        </div>

        <MiniCalendar readDays={readDays} />
      </aside>
    </div>
  );
}
