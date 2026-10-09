import { useObjectUrl } from "../lib/useObjectUrl";

export default function BookCard({ book, selected, onClick }) {
  const cover = useObjectUrl(book.cover);
  return (
    <button
      onClick={onClick}
      className={`text-left transition ${selected ? "scale-105" : "hover:scale-105"}`}
    >
      <div
        className={`aspect-[2/3] overflow-hidden rounded-lg bg-panel2 ${selected ? "ring-2 ring-accent" : ""}`}
      >
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center p-2 text-center text-sm text-white/60">
            {book.title}
          </div>
        )}
      </div>
    </button>
  );
}
