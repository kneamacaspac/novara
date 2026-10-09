import Dexie from "dexie";

export const db = new Dexie("novara");

db.version(1).stores({
  books: "++id, title, author, genre, addedAt",
  progress: "bookId, updatedAt",
  sessions: "++id, &[bookId+date], date, bookId",
  bookmarks: "++id, bookId, folderId, createdAt",
  highlights: "++id, bookId, createdAt",
  folders: "++id, name",
  notes: "++id, folderId, bookId, updatedAt",
  settings: "key",
});
