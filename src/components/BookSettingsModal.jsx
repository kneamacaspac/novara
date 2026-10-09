import { useState } from "react";
import Modal from "./Modal";
import { GENRES, inputCls } from "./AddBookModal";
import { updateBook, deleteBook } from "../services/bookService";

export default function BookSettingsModal({ book, onClose, onDeleted }) {
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    genre: book.genre,
    pages: book.pages,
    published: book.published,
    synopsis: book.synopsis,
  });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save() {
    await updateBook(book.id, { ...form, pages: Number(form.pages) || 0 });
    onClose();
  }

  async function newCover(e) {
    const f = e.target.files[0];
    if (f) await updateBook(book.id, { cover: f });
  }

  async function remove() {
    if (
      !confirm(
        "Delete this book and all its bookmarks, highlights and reading history?",
      )
    )
      return;
    await deleteBook(book.id);
    onClose();
    onDeleted();
  }

  return (
    <Modal title="Book settings" onClose={onClose}>
      <div className="flex flex-col gap-2">
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
            placeholder="Pages"
          />
        </div>
        <input
          className={inputCls}
          value={form.published || ""}
          onChange={set("published")}
          placeholder="First published (e.g. 2020-09-01)"
        />
        <textarea
          className={inputCls}
          rows={4}
          value={form.synopsis || ""}
          onChange={set("synopsis")}
          placeholder="Synopsis"
        />
        <label className="text-sm text-white/70">
          Change cover
          <input
            type="file"
            accept="image/*"
            onChange={newCover}
            className="mt-1 block"
          />
        </label>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button onClick={remove} className="text-red-400">
          Delete book
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-accent px-4 py-2 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
