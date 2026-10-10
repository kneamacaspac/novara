import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Pencil,
  Trash2,
  Settings as Cog,
  FolderOpen,
  Palette,
  BookOpen,
  Copy,
} from "lucide-react";
import { db } from "../db";
import {
  addFolder,
  addNote,
  ensureDefaultFolder,
  deleteFolder,
  updateNoteMeta,
  deleteNote,
} from "../services/noteService";
import {
  moveBookmark,
  updateBookmark,
  deleteBookmark,
} from "../services/bookmarkService";
import { deleteHighlight } from "../services/highlightService";
import { PALETTE, tintStyle } from "../lib/ui";
import ContextMenu, { useContextMenu } from "../components/ContextMenu";
import FolderSettingsModal from "../components/FolderSettingsModal";
import ItemSettingsModal from "../components/ItemSettingsModal";

export default function Notebook() {
  const nav = useNavigate();
  const ctx = useContextMenu();
  const [q, setQ] = useState("");
  const [grid, setGrid] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [modal, setModal] = useState(null); // { type: 'folder' | 'note' | 'bookmark', item }

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
  const bmDefault = (b) =>
    `${bookTitle(b.bookId)} | ${b.page ? "pg " + b.page : Math.round(b.percent * 100) + "%"}`;
  const bmName = (b) => b.name || bmDefault(b); // a custom name wins over the default label
  const noteCount = (f) => notes.filter((n) => n.folderId === f.id).length;
  const count = (f) =>
    noteCount(f) + bookmarks.filter((b) => b.folderId === f.id).length;

  const shownFolders = folders.filter((f) => has(f.name));
  const shownNotes = notes
    .filter((n) => has(n.title) || has(n.body))
    .slice(0, 3);
  const allBookmarks = bookmarks.filter((b) => has(bmName(b)));
  const shownBookmarks = showAll ? allBookmarks : allBookmarks.slice(0, 5);

  const openFolder = (f) => nav(`/notebook/${f.id}`);
  const openNote = (n) => nav(`/notebook/${n.folderId}?note=${n.id}`);
  const openBookmark = (b) =>
    nav(`/read/${b.bookId}?at=${encodeURIComponent(b.location)}`);

  async function newFolder() {
    const name = prompt("Folder name");
    if (name) await addFolder(name, PALETTE[folders.length % PALETTE.length]);
  }

  async function newNote() {
    const folderId = await ensureDefaultFolder();
    const id = await addNote({ folderId });
    nav(`/notebook/${folderId}?note=${id}`);
  }

  async function removeFolder(f) {
    const n = noteCount(f);
    const message = n
      ? `Delete "${f.name}" and its ${n} note${n === 1 ? "" : "s"}? Bookmarks inside will be kept, without a folder.`
      : `Delete the folder "${f.name}"?`;
    if (confirm(message)) await deleteFolder(f.id);
  }
  async function removeNote(n) {
    if (confirm(`Delete "${n.title}"?`)) await deleteNote(n.id);
  }
  async function removeBookmark(b) {
    if (confirm("Delete this bookmark?")) await deleteBookmark(b.id);
  }
  async function removeHighlight(h) {
    if (confirm("Delete this highlight?")) await deleteHighlight(h.id);
  }

  // What each right-click menu offers
  const folderMenu = (f) => [
    { label: "Open", icon: FolderOpen, onClick: () => openFolder(f) },
    {
      label: "Customize",
      icon: Palette,
      onClick: () => setModal({ type: "folder", item: f }),
    },
    {
      label: "Delete folder",
      icon: Trash2,
      danger: true,
      onClick: () => removeFolder(f),
    },
  ];
  const noteMenu = (n) => [
    { label: "Open", icon: Pencil, onClick: () => openNote(n) },
    {
      label: "Customize",
      icon: Palette,
      onClick: () => setModal({ type: "note", item: n }),
    },
    {
      label: "Delete note",
      icon: Trash2,
      danger: true,
      onClick: () => removeNote(n),
    },
  ];
  const bookmarkMenu = (b) => [
    { label: "Open in reader", icon: BookOpen, onClick: () => openBookmark(b) },
    {
      label: "Customize",
      icon: Palette,
      onClick: () => setModal({ type: "bookmark", item: b }),
    },
    {
      label: "Delete bookmark",
      icon: Trash2,
      danger: true,
      onClick: () => removeBookmark(b),
    },
  ];
  const highlightMenu = (h) => [
    {
      label: "Copy text",
      icon: Copy,
      onClick: () => navigator.clipboard.writeText(h.text),
    },
    {
      label: "Delete highlight",
      icon: Trash2,
      danger: true,
      onClick: () => removeHighlight(h),
    },
  ];

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
          <button
            onClick={newFolder}
            className="rounded-lg bg-panel2 p-2"
            title="New folder"
          >
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
          {shownFolders.map((f) => {
            const color = f.color || PALETTE[0];
            return (
              <div
                key={f.id}
                role="button"
                tabIndex={0}
                onClick={() => openFolder(f)}
                onKeyDown={(e) => e.key === "Enter" && openFolder(f)}
                onContextMenu={(e) => ctx.open(e, folderMenu(f))}
                className="group relative h-28 cursor-pointer rounded-xl p-4 text-left"
                style={{
                  background: color + "33",
                  border: `1px solid ${color}66`,
                }}
              >
                <div className="pr-8 font-semibold">{f.name}</div>
                <div className="text-xs text-white/60">{count(f)} items</div>
                {f.description && (
                  <div className="mt-1 truncate text-xs text-white/50">
                    {f.description}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({ type: "folder", item: f });
                  }}
                  className="absolute right-2 top-2 rounded-lg p-1.5 text-white/50 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  title="Folder settings"
                >
                  <Cog size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent Bookmarks</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {shownBookmarks.map((b) => (
            <div
              key={b.id}
              className="glass p-3 text-sm"
              style={tintStyle(b.color)}
              onContextMenu={(e) => ctx.open(e, bookmarkMenu(b))}
            >
              <button
                onClick={() => openBookmark(b)}
                className="block w-full truncate text-left"
              >
                {bmName(b)}
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
              onClick={() => openNote(n)}
              onContextMenu={(e) => ctx.open(e, noteMenu(n))}
              className="glass p-4 text-left"
              style={tintStyle(n.color)}
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
                onContextMenu={(e) => ctx.open(e, highlightMenu(h))}
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
                  onClick={() => removeHighlight(h)}
                  className="text-white/40 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
      </section>

      <ContextMenu menu={ctx.menu} onClose={ctx.close} />

      {modal && modal.type === "folder" && (
        <FolderSettingsModal
          folder={modal.item}
          noteCount={noteCount(modal.item)}
          onClose={() => setModal(null)}
        />
      )}

      {modal && modal.type === "note" && (
        <ItemSettingsModal
          heading="Customize note"
          nameLabel="Note title"
          initialName={modal.item.title}
          initialColor={modal.item.color}
          deleteLabel="Delete note"
          deleteMessage={`Delete "${modal.item.title}"?`}
          onSave={({ name, color }) =>
            updateNoteMeta(modal.item.id, {
              title: name || "Untitled note",
              color,
            })
          }
          onDelete={() => deleteNote(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal && modal.type === "bookmark" && (
        <ItemSettingsModal
          heading="Customize bookmark"
          nameLabel="Bookmark name"
          namePlaceholder={bmDefault(modal.item)}
          initialName={modal.item.name || ""}
          initialColor={modal.item.color}
          deleteLabel="Delete bookmark"
          deleteMessage="Delete this bookmark?"
          onSave={({ name, color }) =>
            updateBookmark(modal.item.id, { name, color })
          }
          onDelete={() => deleteBookmark(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
