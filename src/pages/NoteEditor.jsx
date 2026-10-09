import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Trash2 } from "lucide-react";
import { db } from "../db";
import { addNote, saveNote, deleteNote } from "../services/noteService";

export default function NoteEditor() {
  const nav = useNavigate();
  const fid = Number(useParams().folderId);
  const [params, setParams] = useSearchParams();
  const noteId = Number(params.get("note")) || null;
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);

  const data = useLiveQuery(
    async () => ({
      folder: await db.folders.get(fid),
      notes: (
        await db.notes.where("folderId").equals(fid).sortBy("updatedAt")
      ).reverse(),
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

  if (!data) return null;
  const { folder, notes, bookmarks, books } = data;
  const bookTitle = (id) =>
    (books.find((b) => b.id === id) || {}).title || "Unknown book";
  const has = (s) => (s || "").toLowerCase().includes(q.toLowerCase());

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

  async function remove(id) {
    if (!confirm("Delete this note?")) return;
    await deleteNote(id);
    if (id === noteId) setParams({});
  }

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
        <h1 className="flex-1 text-2xl font-bold">
          {folder ? folder.name : "Folder"}
        </h1>
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
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="w-72 shrink-0 space-y-2 overflow-y-auto">
          {notes
            .filter((n) => has(n.title) || has(n.body))
            .map((n) => (
              <div
                key={n.id}
                className={`glass flex items-start p-3 ${n.id === noteId ? "ring-1 ring-accent" : ""}`}
              >
                <button
                  onClick={() => setParams({ note: n.id })}
                  className="flex-1 text-left"
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="line-clamp-2 text-xs text-white/60">
                    {n.body}
                  </div>
                </button>
                <button
                  onClick={() => remove(n.id)}
                  className="text-white/40 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          {bookmarks.map((b) => (
            <button
              key={b.id}
              onClick={() =>
                nav(`/read/${b.bookId}?at=${encodeURIComponent(b.location)}`)
              }
              className="glass block w-full p-3 text-left text-sm"
            >
              {bookTitle(b.bookId)} |{" "}
              {b.page ? "pg " + b.page : Math.round(b.percent * 100) + "%"}
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
    </div>
  );
}
