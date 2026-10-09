import { db } from "../db";

export const addHighlight = (h) =>
  db.highlights.add({ ...h, createdAt: Date.now() });
export const deleteHighlight = (id) => db.highlights.delete(id);

export async function undoLastPen(bookId, page) {
  const strokes = await db.highlights
    .where("bookId")
    .equals(bookId)
    .filter((h) => h.kind === "pen" && h.page === page)
    .sortBy("createdAt");
  const last = strokes.pop();
  if (last) await db.highlights.delete(last.id);
}
