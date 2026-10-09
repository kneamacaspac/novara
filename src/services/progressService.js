import { db } from "../db";

export const getProgress = (bookId) => db.progress.get(bookId);

// put = insert, or replace if the key already exists
export const saveProgress = (bookId, location, percent) =>
  db.progress.put({ bookId, location, percent, updatedAt: Date.now() });
