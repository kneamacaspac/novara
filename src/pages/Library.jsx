import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Search } from "lucide-react";
import { db } from "../db";
import BookCard from "../components/BookCard";
import BookDetailPanel from "../components/BookDetailPanel";
import AddBookModal from "../components/AddBookModal";

export default function Library() {
  // The third argument is the value used while the query is still loading
  const books = useLiveQuery(
    () => db.books.orderBy("addedAt").reverse().toArray(),
    [],
    [],
  );
  const progress = useLiveQuery(() => db.progress.toArray(), [], []);
  const pct = Object.fromEntries(
    progress.map((p) => [p.bookId, p.percent || 0]),
  );

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);

  const shown = books.filter((b) => {
    const text = `${b.title} ${b.author}`.toLowerCase();
    if (!text.includes(q.toLowerCase())) return false;
    const p = pct[b.id] || 0;
    if (filter === "favorites") return b.favorite;
    if (filter === "reading") return p > 0 && p < 0.98;
    if (filter === "unread") return p === 0;
    if (filter === "finished") return p >= 0.98;
    return true;
  });

  const selected = books.find((b) => b.id === selectedId);

  return (
    <div className="flex h-full">
      <section className="min-w-0 flex-1 overflow-y-auto p-8">
        <header className="mb-6 flex items-center gap-3">
          <h1 className="flex-1 text-3xl font-bold">My Library</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg bg-panel2 px-3 py-2"
          >
            <option value="all">All books</option>
            <option value="favorites">Favorites</option>
            <option value="reading">In progress</option>
            <option value="unread">Not started</option>
            <option value="finished">Finished</option>
          </select>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="rounded-lg bg-panel2 py-2 pl-9 pr-3 outline-none"
            />
          </div>
        </header>

        {books.length === 0 && (
          <p className="text-white/50">
            Your library is empty. Press + to add an EPUB or PDF.
          </p>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-5">
          {shown.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              selected={b.id === selectedId}
              onClick={() => setSelectedId(b.id)}
            />
          ))}
        </div>

        <button
          onClick={() => setAdding(true)}
          className={`fixed bottom-8 grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-xl ${selected ? "right-[550px]" : "right-8"}`}
        >
          <Plus />
        </button>
      </section>

      {selected && (
        <BookDetailPanel
          book={selected}
          percent={pct[selected.id] || 0}
          onDeleted={() => setSelectedId(null)}
        />
      )}
      {adding && <AddBookModal onClose={() => setAdding(false)} />}
    </div>
  );
}
