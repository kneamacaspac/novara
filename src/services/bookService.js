import { db } from "../db";

export function addBook({
  title,
  author,
  genre,
  synopsis,
  pages,
  published,
  type,
  file,
  cover,
}) {
  return db.books.add({
    title,
    author,
    genre,
    synopsis,
    published,
    type,
    file,
    cover,
    pages: Number(pages) || 0,
    favorite: false,
    addedAt: Date.now(),
  });
}

export const getBook = (id) => db.books.get(Number(id));
export const updateBook = (id, changes) => db.books.update(id, changes);

export async function toggleFavorite(id) {
  const book = await db.books.get(id);
  return db.books.update(id, { favorite: !book.favorite });
}

// A transaction means: all of these deletes succeed together or none do
export async function deleteBook(id) {
  await db.transaction(
    "rw",
    [db.books, db.progress, db.sessions, db.bookmarks, db.highlights],
    async () => {
      await db.books.delete(id);
      await db.progress.delete(id);
      await db.sessions.where("bookId").equals(id).delete();
      await db.bookmarks.where("bookId").equals(id).delete();
      await db.highlights.where("bookId").equals(id).delete();
    },
  );
}
