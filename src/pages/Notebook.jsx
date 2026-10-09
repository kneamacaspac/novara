import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, LayoutGrid, List, Plus, Pencil, Trash2 } from "lucide-react";
import { db } from "../db";
import {
  addFolder,
  addNote,
  ensureDefaultFolder,
} from "../services/noteService";
import { moveBookmark } from "../services/bookmarkService";
import { deleteHighlight } from "../services/highlightService";

const COLORS = ["#7c6cff", "#ef4444", "#22c55e", "#f59e0b", "#06b6d4"];

export default function Notebook() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [grid, setGrid] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const data = useLiveQuery(
    async () => ({
      folders: await db.folders.toArray(),
      notes: (await db.notes.orderBy("updatedAt").toArray()).reverse(),
      bookmarks: (await db.bookmarks.orderBy("createdAt").toArray()).reverse(),
      highlights: (
        await db.highlights.filter((h) => h.kind !== "pen").sortBy("createdAt")
      ).reverse(),
      books: await db.books.toArray(),
    }),
    [],
  );

  if (!data) return null;
  const { folders, notes, bookmarks, highlights, books } = data;

  const bookTitle = (id) =>
    (books.find((b) => b.id === id) || {}).title || "Unknown book";
  const has = (s) => (s || "").toLowerCase().includes(q.toLowerCase());
  const bmLabel = (b) =>
    `${bookTitle(b.bookId)} | ${b.page ? "pg " + b.page : Math.round(b.percent * 100) + "%"}`;
  const count = (f) =>
    notes.filter((n) => n.folderId === f.id).length +
    bookmarks.filter((b) => b.folderId === f.id).length;

  const shownFolders = folders.filter((f) => has(f.name));
  const shownNotes = notes
    .filter((n) => has(n.title) || has(n.body))
    .slice(0, 3);
  const allBookmarks = bookmarks.filter((b) => has(bmLabel(b)));
  const shownBookmarks = showAll ? allBookmarks : allBookmarks.slice(0, 5);

  async function newFolder() {
    const name = prompt("Folder name");
    if (name) await addFolder(name, COLORS[folders.length % COLORS.length]);
  }

  async function newNote() {
    const folderId = await ensureDefaultFolder();
    const id = await addNote({ folderId });
    nav(`/notebook/${folderId}?note=${id}`);
  }

  const openBookmark = (b) =>
    nav(`/read/${b.bookId}?at=${encodeURIComponent(b.location)}`);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="flex-1 text-xl font-semibold">Folders</h2>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="rounded-lg bg-panel2 py-2 pl-8 pr-3 text-sm outline-none"
            />
          </div>
          <button
            onClick={() => setGrid(!grid)}
            className="rounded-lg bg-panel2 p-2"
          >
            {grid ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
          <button onClick={newFolder} className="rounded-lg bg-panel2 p-2">
            <Plus size={16} />
          </button>
        </div>
        {folders.length === 0 && (
          <p className="text-sm text-white/50">
            No folders yet. Press + to make one, or start a note below.
          </p>
        )}
        <div
          className={`grid gap-4 ${grid ? "sm:grid-cols-3" : "grid-cols-1"}`}
        >
          {shownFolders.map((f) => (
            <button
              key={f.id}
              onClick={() => nav(`/notebook/${f.id}`)}
              className="h-28 rounded-xl p-4 text-left"
              style={{
                background: f.color + "33",
                border: `1px solid ${f.color}66`,
              }}
            >
              <div className="font-semibold">{f.name}</div>
              <div className="text-xs text-white/60">{count(f)} items</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent Bookmarks</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {shownBookmarks.map((b) => (
            <div key={b.id} className="glass p-3 text-sm">
              <button
                onClick={() => openBookmark(b)}
                className="block w-full text-left"
              >
                {bmLabel(b)}
              </button>
              <select
                value={b.folderId || ""}
                onChange={(e) =>
                  moveBookmark(
                    b.id,
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="mt-2 w-full rounded bg-panel2 px-2 py-1 text-xs"
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {!showAll && allBookmarks.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="glass p-3 text-sm text-white/70"
            >
              See all bookmarks
            </button>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center">
          <h2 className="flex-1 text-xl font-semibold">Recent Notes</h2>
          <button
            onClick={newNote}
            className="rounded-lg bg-panel2 px-3 py-1 text-sm"
          >
            + New Note
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {shownNotes.map((n) => (
            <button
              key={n.id}
              onClick={() => nav(`/notebook/${n.folderId}?note=${n.id}`)}
              className="glass p-4 text-left"
            >
              <div className="mb-1 flex items-center justify-between font-semibold">
                {n.title}
                <Pencil size={14} className="text-white/50" />
              </div>
              <p className="line-clamp-4 text-sm text-white/70">{n.body}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Highlights</h2>
        {highlights.length === 0 && (
          <p className="text-sm text-white/50">
            Highlights you make while reading show up here.
          </p>
        )}
        <div className="space-y-2">
          {highlights
            .filter((h) => has(h.text) || has(bookTitle(h.bookId)))
            .slice(0, 20)
            .map((h) => (
              <div
                key={h.id}
                className="glass flex items-start gap-3 p-3 text-sm"
              >
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full"
                  style={{ background: h.color }}
                />
                <div className="flex-1">
                  <p>{h.text}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {bookTitle(h.bookId)}
                  </p>
                </div>
                <button
                  onClick={() => deleteHighlight(h.id)}
                  className="text-white/40 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
