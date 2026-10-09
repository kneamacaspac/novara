import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { dayKey } from "../lib/dates";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const sum = (rows, key) => rows.reduce((a, r) => a + (r[key] || 0), 0);
const round1 = (n) => Math.round(n * 10) / 10;

// One live query that gives every page what it needs
export function useStatsData() {
  return useLiveQuery(
    async () => ({
      books: await db.books.toArray(),
      progress: await db.progress.toArray(),
      sessions: await db.sessions.toArray(),
    }),
    [],
  );
}

export function totals(books, progress, sessions) {
  return {
    pages: Math.round(sum(sessions, "pages")),
    hours: round1(sum(sessions, "minutes") / 60),
    booksRead: progress.filter((p) => p.percent >= 0.98).length,
    totalBooks: books.length,
  };
}

// A day counts toward the streak if you read at least 5 minutes
export function computeStreak(sessions, minMinutes = 5) {
  const byDay = {};
  sessions.forEach((s) => {
    byDay[s.date] = (byDay[s.date] || 0) + s.minutes;
  });
  const counts = (d) => (byDay[dayKey(d)] || 0) >= minMinutes;
  const d = new Date();
  if (!counts(d)) d.setDate(d.getDate() - 1); // not read yet today: yesterday keeps the streak alive
  let n = 0;
  while (counts(d)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function weekDays() {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// Sunday to Saturday of this week
export function weeklySeries(sessions) {
  return weekDays().map((d) => {
    const rows = sessions.filter((s) => s.date === dayKey(d));
    return {
      label: DAYS[d.getDay()],
      hours: round1(sum(rows, "minutes") / 60),
      books: new Set(rows.map((r) => r.bookId)).size,
    };
  });
}

// January to December of a year (books = books finished that month)
export function monthlySeries(
  sessions,
  progress,
  year = new Date().getFullYear(),
) {
  return MONTHS.map((label, m) => {
    const prefix = `${year}-${String(m + 1).padStart(2, "0")}`;
    const rows = sessions.filter((s) => s.date.startsWith(prefix));
    const books = progress.filter((p) => {
      const d = new Date(p.updatedAt);
      return (
        p.percent >= 0.98 && d.getFullYear() === year && d.getMonth() === m
      );
    }).length;
    return { label, hours: round1(sum(rows, "minutes") / 60), books };
  });
}

export const weekHours = (sessions) =>
  round1(weeklySeries(sessions).reduce((a, d) => a + d.hours, 0));

function monthPrefix(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const monthMinutes = (sessions, offset) =>
  sum(
    sessions.filter((s) => s.date.startsWith(monthPrefix(offset))),
    "minutes",
  );

// Percent change in reading time vs last month (null if there is no last month data)
export function compareToLastMonth(sessions) {
  const now = monthMinutes(sessions, 0);
  const last = monthMinutes(sessions, -1);
  return last ? Math.round(((now - last) / last) * 100) : null;
}

export const avgDailyHours = (sessions) =>
  round1(monthMinutes(sessions, 0) / 60 / new Date().getDate());

// Hours per genre this month, for the donut chart
export function genreShare(books, sessions) {
  const byId = Object.fromEntries(books.map((b) => [b.id, b]));
  const totalsByGenre = {};
  sessions
    .filter((s) => s.date.startsWith(monthPrefix(0)))
    .forEach((s) => {
      const g = (byId[s.bookId] && byId[s.bookId].genre) || "Other";
      totalsByGenre[g] = (totalsByGenre[g] || 0) + s.minutes / 60;
    });
  return Object.entries(totalsByGenre)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function recentBooks(books, progress, sessions, n = 3) {
  const byId = Object.fromEntries(books.map((b) => [b.id, b]));
  return [...progress]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((p) => ({
      book: byId[p.bookId],
      percent: p.percent || 0,
      hours: round1(
        sum(
          sessions.filter((s) => s.bookId === p.bookId),
          "minutes",
        ) / 60,
      ),
    }))
    .filter((r) => r.book)
    .slice(0, n);
}
