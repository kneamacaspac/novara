import { db } from "../db";

export const addFolder = (name, color) => db.folders.add({ name, color });

// Notes always live in a folder, so make sure at least one exists
export async function ensureDefaultFolder() {
  const first = await db.folders.toCollection().first();
  return first
    ? first.id
    : db.folders.add({ name: "General", color: "#7c6cff" });
}

export const addNote = ({
  folderId,
  bookId = null,
  title = "Untitled note",
  body = "",
}) => db.notes.add({ folderId, bookId, title, body, updatedAt: Date.now() });

export const saveNote = (id, changes) =>
  db.notes.update(id, { ...changes, updatedAt: Date.now() });
export const deleteNote = (id) => db.notes.delete(id);

export async function deleteFolder(id) {
  await db.transaction("rw", [db.folders, db.notes, db.bookmarks], async () => {
    await db.notes.where("folderId").equals(id).delete();
    await db.bookmarks.where("folderId").equals(id).modify({ folderId: null });
    await db.folders.delete(id);
  });
}
