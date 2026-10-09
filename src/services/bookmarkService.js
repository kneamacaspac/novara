import { db } from "../db";

export const addBookmark = ({
  bookId,
  location,
  page = null,
  percent = 0,
  label = "",
}) =>
  db.bookmarks.add({
    bookId,
    location: String(location),
    page,
    percent,
    label,
    folderId: null,
    createdAt: Date.now(),
  });

export const deleteBookmark = (id) => db.bookmarks.delete(id);
export const moveBookmark = (id, folderId) =>
  db.bookmarks.update(id, { folderId });
