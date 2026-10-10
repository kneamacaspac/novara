import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  Trash2,
  Settings as Cog,
  Pencil,
  Palette,
  BookOpen,
  FolderMinus,
} from "lucide-react";
import { db } from "../db";
import {
  addNote,
  saveNote,
  updateNoteMeta,
  deleteNote,
} from "../services/noteService";
import {
  moveBookmark,
  updateBookmark,
  deleteBookmark,
} from "../services/bookmarkService";
import { tintStyle } from "../lib/ui";
import ContextMenu, { useContextMenu } from "../components/ContextMenu";
import FolderSettingsModal from "../components/FolderSettingsModal";
import ItemSettingsModal from "../components/ItemSettingsModal";

export default function NoteEditor() {
  const nav = useNavigate();
  const ctx = useContextMenu();
  const fid = Number(useParams().folderId);
  const [params, setParams] = useSearchParams();
  const noteId = Number(params.get("note")) || null;
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState(null); // { type: 'folder' | 'note' | 'bookmark', item }

  const data = useLiveQuery(
    async () => ({
      folder: await db.folders.get(fid),
      notes: await db.notes.where("folderId").equals(fid).toArray(),
      bookmarks: await db.bookmarks.where("folderId").equals(fid).toArray(),
      books: await db.books.toArray(),
    }),
    [fid],
  );

  const loaded = Boolean(data);

  // Load the selected note into the editor when you pick a different note
  useEffect(() => {
    if (!data) return;
    const n = data.notes.find((x) => x.id === noteId);
    setDraft(
      n ? { title: n.title, body: n.body, bookId: n.bookId || "" } : null,
    );
  }, [noteId, loaded]);

  // If this folder was deleted (from the settings window), go back to the Notebook
  useEffect(() => {
    if (data && !data.folder) nav("/notebook");
  }, [data]);

  if (!data || !data.folder) return null;
  const { folder, notes, bookmarks, books } = data;
  const folderColor = folder.color || "#7c6cff";

  const bookTitle = (id) =>
    (books.find((b) => b.id === id) || {}).title || "Unknown book";
  const has = (s) => (s || "").toLowerCase().includes(q.toLowerCase());
  const bmDefault = (b) =>
    `${bookTitle(b.bookId)} | ${b.page ? "pg " + b.page : Math.round(b.percent * 100) + "%"}`;
  const bmName = (b) => b.name || bmDefault(b);

  // Sort order chosen in the folder settings
  const sorted = [...notes].sort((a, b) => {
    if (folder.sort === "title") return a.title.localeCompare(b.title);
    if (folder.sort === "oldest") return a.updatedAt - b.updatedAt;
    return b.updatedAt - a.updatedAt;
  });

  async function create() {
    const id = await addNote({ folderId: fid });
    setParams({ note: id });
  }

  async function save() {
    await saveNote(noteId, {
      title: draft.title,
      body: draft.body,
      bookId: draft.bookId ? Number(draft.bookId) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function removeNote(n) {
    if (!confirm(`Delete "${n.title}"?`)) return;
    await deleteNote(n.id);
    if (n.id === noteId) setParams({});
  }
  async function removeBookmark(b) {
    if (confirm("Delete this bookmark?")) await deleteBookmark(b.id);
  }

  const noteMenu = (n) => [
    { label: "Open", icon: Pencil, onClick: () => setParams({ note: n.id }) },
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
    {
      label: "Open in reader",
      icon: BookOpen,
      onClick: () =>
        nav(`/read/${b.bookId}?at=${encodeURIComponent(b.location)}`),
    },
    {
      label: "Customize",
      icon: Palette,
      onClick: () => setModal({ type: "bookmark", item: b }),
    },
    {
      label: "Remove from folder",
      icon: FolderMinus,
      onClick: () => moveBookmark(b.id, null),
    },
    {
      label: "Delete bookmark",
      icon: Trash2,
      danger: true,
      onClick: () => removeBookmark(b),
    },
  ];

  const field =
    "w-full rounded-lg border border-line bg-panel2 px-3 py-2 outline-none focus:border-accent";

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => nav("/notebook")}
          className="rounded-lg p-2 hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>
        <span
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ background: folderColor }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{folder.name}</h1>
          {folder.description && (
            <p className="truncate text-sm text-white/60">
              {folder.description}
            </p>
          )}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="rounded-lg bg-panel2 px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={create}
          className="rounded-lg bg-panel2 px-3 py-2 text-sm"
        >
          + New Note
        </button>
        <button
          onClick={() => setModal({ type: "folder", item: folder })}
          className="rounded-lg bg-panel2 p-2 hover:bg-white/10"
          title="Folder settings"
        >
          <Cog size={18} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="w-72 shrink-0 space-y-2 overflow-y-auto">
          {sorted
            .filter((n) => has(n.title) || has(n.body))
            .map((n) => (
              <div
                key={n.id}
                className={`glass flex items-start p-3 ${n.id === noteId ? "ring-1 ring-accent" : ""}`}
                style={tintStyle(n.color)}
                onContextMenu={(e) => ctx.open(e, noteMenu(n))}
              >
                <button
                  onClick={() => setParams({ note: n.id })}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate font-medium">{n.title}</div>
                  <div className="line-clamp-2 text-xs text-white/60">
                    {n.body}
                  </div>
                </button>
                <button
                  onClick={() => removeNote(n)}
                  className="text-white/40 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          {bookmarks
            .filter((b) => has(bmName(b)))
            .map((b) => (
              <button
                key={b.id}
                onClick={() =>
                  nav(`/read/${b.bookId}?at=${encodeURIComponent(b.location)}`)
                }
                onContextMenu={(e) => ctx.open(e, bookmarkMenu(b))}
                className="glass block w-full truncate p-3 text-left text-sm"
                style={tintStyle(b.color)}
              >
                {bmName(b)}
              </button>
            ))}
        </div>

        <div className="glass flex min-w-0 flex-1 flex-col gap-3 p-4">
          {!draft && (
            <p className="text-white/50">
              Pick a note on the left, or press + New Note.
            </p>
          )}
          {draft && (
            <>
              <input
                className={field}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Note Title"
              />
              <select
                className={field}
                value={draft.bookId}
                onChange={(e) => setDraft({ ...draft, bookId: e.target.value })}
              >
                <option value="">Related Book (optional)</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
              <textarea
                className={`${field} flex-1 resize-none`}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Write your note..."
              />
              <button
                onClick={save}
                className="rounded-lg bg-accent py-2 font-medium"
              >
                {saved ? "Saved" : "Save Note"}
              </button>
            </>
          )}
        </div>
      </div>

      <ContextMenu menu={ctx.menu} onClose={ctx.close} />

      {modal && modal.type === "folder" && (
        <FolderSettingsModal
          folder={modal.item}
          noteCount={notes.length}
          onClose={() => setModal(null)}
          onDeleted={() => nav("/notebook")}
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
          onSave={async ({ name, color }) => {
            await updateNoteMeta(modal.item.id, {
              title: name || "Untitled note",
              color,
            });
            // keep the editor's title box in sync if this note is open
            if (modal.item.id === noteId)
              setDraft((d) => d && { ...d, title: name || "Untitled note" });
          }}
          onDelete={async () => {
            await deleteNote(modal.item.id);
            if (modal.item.id === noteId) setParams({});
          }}
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
