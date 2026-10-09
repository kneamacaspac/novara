import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Bookmark, Settings as Cog } from "lucide-react";
import { useObjectUrl } from "../lib/useObjectUrl";
import { toggleFavorite } from "../services/bookService";
import BookSettingsModal from "./BookSettingsModal";

export default function BookDetailPanel({ book, percent, onDeleted }) {
  const cover = useObjectUrl(book.cover);
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const pct = Math.round(percent * 100);

  return (
    <aside className="relative w-[520px] shrink-0 overflow-hidden border-1 border-line">
      {cover && (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur"
        />
      )}
      <div className="relative flex h-full flex-col gap-4 overflow-y-auto bg-black/40 p-6">
        <button
          onClick={() => setEditing(true)}
          className="self-end rounded-lg p-2 hover:bg-white/10"
          title="Book settings"
        >
          <Cog size={18} />
        </button>
        <h2 className="text-3xl font-bold">{book.title}</h2>
        <p className="text-white/70">by {book.author || "Unknown author"}</p>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm">{pct}%</span>
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          {book.synopsis || "No synopsis yet. Add one in book settings."}
        </p>
        <p className="text-xs text-white/60">
          Genre: {book.genre}
          {book.published ? ` | First published ${book.published}` : ""}
          {book.pages ? ` | ${book.pages} pages` : ""}
        </p>
        <div className="mt-auto flex gap-2">
          <button
            onClick={() => nav(`/read/${book.id}`)}
            className="flex-1 rounded-xl bg-white py-3 font-semibold text-black"
          >
            Continue Reading
          </button>
          <button
            onClick={() => toggleFavorite(book.id)}
            className="rounded-xl bg-white/10 p-3"
            title="Favorite"
          >
            <Heart size={20} fill={book.favorite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => nav("/notebook")}
            className="rounded-xl bg-white/10 p-3"
            title="Bookmarks"
          >
            <Bookmark size={20} />
          </button>
        </div>
      </div>
      {editing && (
        <BookSettingsModal
          book={book}
          onClose={() => setEditing(false)}
          onDeleted={onDeleted}
        />
      )}
    </aside>
  );
}
