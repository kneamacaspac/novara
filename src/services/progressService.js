import { db } from "../db";

export const getProgress = (bookId) => db.progress.get(bookId);

// put = insert, or replace if the key already exists
export async function saveProgress(bookId, location, percent) {
  const old = await db.progress.get(bookId);
  return db.progress.put({
    bookId,
    location,
    percent: percent ?? old?.percent ?? 0,
    updatedAt: Date.now(),
  });
}
