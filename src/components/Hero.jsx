import { useNavigate } from "react-router-dom";
import { Heart, Bookmark } from "lucide-react";
import { useObjectUrl } from "../lib/useObjectUrl";
import { toggleFavorite } from "../services/bookService";

export default function Hero({ book, side, footer }) {
  const nav = useNavigate();
  const cover = useObjectUrl(book.cover);

  return (
    <div className="relative min-h-full overflow-hidden">
      {cover && (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl"
        />
      )}
      <div className="relative flex min-h-full flex-col gap-6 bg-black/40 p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-3">
            <h1 className="text-5xl font-bold">{book.title}</h1>
            <p className="text-white/70">
              by {book.author || "Unknown author"}
            </p>
            <p className="line-clamp-5 max-w-xl text-sm text-white/80">
              {book.synopsis}
            </p>
            <p className="text-xs text-white/60">
              Genre: {book.genre}
              {book.published ? ` | First published ${book.published}` : ""}
              {book.pages ? ` | ${book.pages} pages` : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => nav(`/read/${book.id}`)}
                className="rounded-full bg-white/15 px-5 py-2 text-sm font-medium"
              >
                Continue Reading
              </button>
              <button
                onClick={() => toggleFavorite(book.id)}
                className="rounded-full bg-white/15 p-2"
              >
                <Heart
                  size={18}
                  fill={book.favorite ? "currentColor" : "none"}
                />
              </button>
              <button
                onClick={() => nav("/notebook")}
                className="rounded-full bg-white/15 p-2"
              >
                <Bookmark size={18} />
              </button>
            </div>
          </div>
          <div className="space-y-4">{side}</div>
        </div>
        <div className="mt-auto">{footer}</div>
      </div>
    </div>
  );
}
