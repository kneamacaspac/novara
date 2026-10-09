import { useObjectUrl } from "../lib/useObjectUrl";

function Row({ rank, book, hours, percent }) {
  const cover = useObjectUrl(book.cover);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-hidden border-b border-white/5 py-0.5 last:border-0">
      <span className="w-5 shrink-0 text-[clamp(0.65rem,1.5vh,0.875rem)] text-white/50">
        {String(rank).padStart(2, "0")}
      </span>
      {cover && (
        <img
          src={cover}
          alt=""
          className="h-[clamp(1.5rem,5vh,2.5rem)] w-[clamp(1rem,3.5vh,1.75rem)] shrink-0 rounded object-cover"
        />
      )}
      <span className="min-w-0 flex-1 truncate text-[clamp(0.65rem,1.5vh,0.875rem)]">
        {book.title}
      </span>
      <span className="shrink-0 text-xs text-white/60">{hours} hr</span>
      <span className="shrink-0 text-xs text-white/60">
        {Math.round(percent * 100)}%
      </span>
    </div>
  );
}

export default function RecentBooks({ rows }) {
  return (
    <div className="glass flex min-h-0 flex-col overflow-hidden p-[clamp(0.65rem,1vw,1rem)]">
      <h3 className="mb-2 shrink-0 font-semibold">Recent Books</h3>
      {rows.length === 0 && (
        <p className="min-h-0 flex-1 truncate text-sm text-white/50">
          Nothing read yet.
        </p>
      )}
      {rows.map((r, i) => (
        <Row key={r.book.id} rank={i + 1} {...r} />
      ))}
    </div>
  );
}
