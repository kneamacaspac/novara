import { useMemo, useState } from "react";
import Modal from "./Modal";
import { readMeta } from "../lib/metadata";
import { addBook } from "../services/bookService";

export const GENRES = [
  "Fantasy",
  "Romance",
  "Fiction",
  "Thriller",
  "Mystery",
  "Young Adult",
  "Self Help",
  "Sci-Fi",
  "Non-fiction",
  "Other",
];
export const inputCls =
  "w-full rounded-lg border border-line bg-panel2 px-3 py-2 outline-none focus:border-accent";

export default function AddBookModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const coverUrl = useMemo(
    () => (form?.cover ? URL.createObjectURL(form.cover) : null),
    [form?.cover],
  );

  async function pick(e) {
    const f = e.target.files[0];
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      const meta = await readMeta(f);
      setFile(f);
      setForm({ genre: "Fiction", ...meta });
    } catch (err) {
      console.error(err);
      setError("Could not read that file. Is it a valid EPUB or PDF?");
    }
    setBusy(false);
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save() {
    await addBook({ ...form, file }); // the File itself is stored as a Blob
    onClose();
  }

  return (
    <Modal title="Add a book" onClose={onClose}>
      {!form && (
        <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line p-10 text-white/70 hover:border-accent">
          {busy ? "Reading file..." : "Click to choose an EPUB or PDF"}
          <input
            type="file"
            accept=".epub,.pdf,application/epub+zip,application/pdf"
            className="hidden"
            onChange={pick}
          />
        </label>
      )}
      {error && <p className="mt-3 text-red-400">{error}</p>}
      {form && (
        <div className="flex gap-4">
          <div className="w-28 shrink-0">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-panel2">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <input
              className={inputCls}
              value={form.title || ""}
              onChange={set("title")}
              placeholder="Title"
            />
            <input
              className={inputCls}
              value={form.author || ""}
              onChange={set("author")}
              placeholder="Author"
            />
            <div className="flex gap-2">
              <select
                className={inputCls}
                value={form.genre}
                onChange={set("genre")}
              >
                {GENRES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <input
                className={inputCls}
                type="number"
                value={form.pages || ""}
                onChange={set("pages")}
                placeholder="Pages (optional)"
              />
            </div>
            <textarea
              className={inputCls}
              rows={4}
              value={form.synopsis || ""}
              onChange={set("synopsis")}
              placeholder="Synopsis"
            />
          </div>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 hover:bg-white/10"
        >
          Cancel
        </button>
        {form && (
          <button
            onClick={save}
            className="rounded-lg bg-accent px-4 py-2 font-medium"
          >
            Save book
          </button>
        )}
      </div>
    </Modal>
  );
}
