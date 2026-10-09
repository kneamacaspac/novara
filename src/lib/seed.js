import { db } from "../db";
import { dayKey } from "./dates";

// DEV ONLY: fills fake reading history so you can test the charts
export async function seedSessions() {
  const book = await db.books.toCollection().first();
  if (!book) return "Add a book first";
  for (let i = 0; i < 40; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (Math.random() < 0.3) continue;
    const date = dayKey(d);
    const exists = await db.sessions
      .where("[bookId+date]")
      .equals([book.id, date])
      .first();
    if (!exists)
      await db.sessions.add({
        bookId: book.id,
        date,
        minutes: 10 + Math.random() * 80,
        pages: 5 + Math.random() * 40,
      });
  }
  return "done";
}

export const clearSessions = () => db.sessions.clear();
