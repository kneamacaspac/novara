import { db } from "../db";
import { dayKey } from "../lib/dates";

// One row per book per day. We keep adding minutes and pages to today's row.
export async function addToSession(bookId, minutes, pages = 0) {
  const date = dayKey();
  await db.transaction("rw", db.sessions, async () => {
    const row = await db.sessions
      .where("[bookId+date]")
      .equals([bookId, date])
      .first();
    if (row) {
      await db.sessions.update(row.id, {
        minutes: row.minutes + minutes,
        pages: row.pages + pages,
      });
    } else {
      await db.sessions.add({ bookId, date, minutes, pages });
    }
  });
}
