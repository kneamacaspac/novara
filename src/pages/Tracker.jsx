import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Flame } from "lucide-react";
import {
  useStatsData,
  totals,
  computeStreak,
  genreShare,
  weeklySeries,
  monthlySeries,
  compareToLastMonth,
  avgDailyHours,
  weekHours,
  recentBooks,
} from "../services/statsService";
import { useSetting } from "../services/settingsService";
import { greeting } from "../lib/dates";
import { useObjectUrl } from "../lib/useObjectUrl";
import RecentBooks from "../components/RecentBooks";

const PALETTE = [
  "#7c6cff",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

function Tile({ label, value }) {
  return (
    <div className="glass min-h-0 min-w-0 overflow-hidden p-[clamp(0.65rem,1vw,1rem)]">
      <div className="break-words text-[clamp(1.1rem,3.5vh,1.875rem)] font-bold leading-tight">
        {value}
      </div>
      <div className="text-[clamp(0.6rem,1.4vh,0.875rem)] leading-tight text-white/60">
        {label}
      </div>
    </div>
  );
}

function ContinueCard({ row, onOpen }) {
  const cover = useObjectUrl(row ? row.book.cover : null);
  if (!row) return null;
  return (
    <button
      onClick={onOpen}
      className="glass flex min-h-0 w-full items-center gap-3 overflow-hidden p-[clamp(0.65rem,1vw,1rem)] text-left"
    >
      {cover && (
        <img
          src={cover}
          alt=""
          className="h-[clamp(2rem,7vh,4rem)] w-[clamp(1.4rem,5vh,2.75rem)] shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="text-xs text-white/50">Continue Reading</div>
        <div className="line-clamp-2 font-semibold leading-tight">
          {row.book.title}
        </div>
        <div className="text-xs text-white/60">
          {Math.round(row.percent * 100)}% complete
        </div>
      </div>
    </button>
  );
}

export default function Tracker() {
  const nav = useNavigate();
  const data = useStatsData();
  const goal = useSetting("weeklyGoalHours", 5);
  const name = useSetting("userName", "Reader");
  const [range, setRange] = useState("month");
  if (!data) return null;

  const { books, progress, sessions } = data;
  const t = totals(books, progress, sessions);
  const streak = computeStreak(sessions);
  const genres = genreShare(books, sessions);
  const series =
    range === "month"
      ? monthlySeries(sessions, progress)
      : weeklySeries(sessions);
  const change = compareToLastMonth(sessions);
  const done = weekHours(sessions);
  const left = Math.max(0, Math.round((goal - done) * 10) / 10);
  const rows = recentBooks(books, progress, sessions, 3);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[clamp(0.5rem,1.5vh,1rem)] overflow-hidden p-[clamp(0.75rem,2vw,2rem)]">
      <h1 className="min-w-0 truncate text-[clamp(1.5rem,4vh,2rem)] font-bold leading-tight">
        {greeting()}, {name}!
      </h1>

      <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_minmax(15rem,25%)] gap-[clamp(0.5rem,1.5vw,1rem)]">
        <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,2.5fr)] gap-[clamp(0.5rem,1.5vh,1rem)]">
          <div className="grid min-h-0 grid-cols-2 gap-[clamp(0.5rem,1.5vw,1rem)] sm:grid-cols-4">
            <Tile label="Pages Read" value={t.pages} />
            <Tile label="Hours" value={t.hours} />
            <Tile label="Books Read" value={t.booksRead} />
            <Tile label="Total Books" value={t.totalBooks} />
          </div>

          <div className="grid min-h-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-[clamp(0.5rem,1.5vw,1rem)]">
            <div className="glass flex min-h-0 min-w-0 items-center gap-3 overflow-hidden p-[clamp(0.65rem,1vw,1rem)]">
              <Flame className="shrink-0 text-orange-400" size={40} />
              <div>
                <div className="text-[clamp(1.5rem,4vh,2.25rem)] font-bold leading-tight">
                  {streak}
                </div>
                <div className="text-[clamp(0.65rem,1.4vh,0.875rem)] leading-tight text-white/60">
                  Reading Streak
                </div>
              </div>
            </div>

            <div className="glass flex min-h-0 min-w-0 items-center gap-2 overflow-hidden p-[clamp(0.65rem,1vw,1rem)]">
              <div className="w-[clamp(4rem,7vw,6rem)] shrink-0 text-[clamp(0.6rem,1.2vh,0.75rem)] leading-tight text-white/60">
                Most read genre this month
                <div className="line-clamp-2 text-sm font-semibold text-white">
                  {genres[0] ? genres[0].name : "-"}
                </div>
              </div>
              <div className="h-full min-h-0 min-w-0 flex-1">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={genres}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="90%"
                      stroke="none"
                    >
                      {genres.map((g, i) => (
                        <Cell key={g.name} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 text-[clamp(0.55rem,1.1vh,0.75rem)] leading-tight">
                {genres.slice(0, 5).map((g, i) => (
                  <li key={g.name} className="flex min-w-0 items-center gap-1">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PALETTE[i % PALETTE.length] }}
                    />
                    <span className="truncate">{g.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass flex min-h-0 min-w-0 flex-col overflow-hidden p-[clamp(0.65rem,1vw,1rem)]">
            <div className="mb-2 flex shrink-0 items-center">
              <h3 className="flex-1 font-semibold">Reading Tracker</h3>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="rounded bg-panel2 px-2 py-1 text-sm"
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
              </select>
            </div>
            <div className="min-h-0 min-w-0 flex-1">
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid stroke="#2e2e33" />
                  <XAxis dataKey="label" stroke="#888" />
                  <YAxis stroke="#888" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#17171a",
                      border: "1px solid #2e2e33",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    name="Reading Hours"
                    stroke="#7c6cff"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="books"
                    name="Books Read"
                    stroke="#d4d4d8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.85fr)] gap-[clamp(0.5rem,1.5vh,1rem)]">
          <RecentBooks rows={rows} />
          <div className="grid min-h-0 grid-cols-2 gap-[clamp(0.5rem,1.5vw,1rem)]">
            <Tile
              label="average daily reading time"
              value={`${avgDailyHours(sessions)} hrs`}
            />
            <Tile
              label="compared with last month"
              value={
                change === null ? "-" : `${change > 0 ? "+" : ""}${change}%`
              }
            />
          </div>
          <ContinueCard
            row={rows[0]}
            onOpen={() => nav(`/read/${rows[0].book.id}`)}
          />
          <div className="glass flex min-h-0 flex-col justify-center overflow-hidden p-[clamp(0.65rem,1vw,1rem)]">
            <h3 className="mb-2 truncate font-semibold">Weekly Reading Goal</h3>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${Math.min(100, (done / (goal || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-white/60">
              {left > 0
                ? `${left} hours left to reach your goal`
                : "Goal reached!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
