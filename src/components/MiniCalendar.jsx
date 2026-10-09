import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { dayKey } from "../lib/dates";
import { dashCard } from "../lib/ui";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// A dropdown that looks like plain text with a small chevron
function Select({ value, onChange, children }) {
  return (
    <label className="relative flex items-center">
      <select
        value={value}
        onChange={onChange}
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-0 text-white/60"
      />
    </label>
  );
}

// readDays is a Set of 'YYYY-MM-DD' strings; days you read get a small dot
export default function MiniCalendar({ readDays }) {
  const [cursor, setCursor] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const thisYear = new Date().getFullYear();
  const years = Array.from(
    new Set([
      thisYear - 5,
      ...Array.from({ length: 11 }, (_, i) => thisYear - 5 + i),
      year,
    ]),
  ).sort();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weekRows = Math.ceil(cells.length / 7); // 4 to 6 rows, they always fill the card
  const today = dayKey();

  return (
    <div className={`${dashCard} flex flex-col`}>
      <div className="flex min-w-0 items-center justify-between gap-2 px-[9%] pt-[2.6vh] text-[clamp(0.8rem,1.7vh,1.05rem)] font-medium">
        <Select
          value={month}
          onChange={(e) => setCursor(new Date(year, Number(e.target.value), 1))}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i} className="bg-[#1b1b1b]">
              {m}
            </option>
          ))}
        </Select>
        <Select
          value={year}
          onChange={(e) =>
            setCursor(new Date(Number(e.target.value), month, 1))
          }
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-[#1b1b1b]">
              {y}
            </option>
          ))}
        </Select>
      </div>

      <div
        className="grid min-h-0 flex-1 grid-cols-7 px-[7%] pb-[2vh] pt-[1.3vh] text-center text-[clamp(0.65rem,1.5vh,0.95rem)]"
        style={{ gridTemplateRows: `auto repeat(${weekRows}, minmax(0, 1fr))` }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-[0.5vh] text-[clamp(0.55rem,1.2vh,0.8rem)] text-white/70"
          >
            {d}
          </div>
        ))}

        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = dayKey(new Date(year, month, d));
          return (
            <div key={i} className="grid place-items-center">
              <span
                className={`relative grid aspect-square h-full max-h-[4.6vh] place-items-center rounded-full ${key === today ? "bg-white/20" : ""}`}
              >
                {d}
                {readDays.has(key) && (
                  <i className="absolute bottom-[10%] h-1 w-1 rounded-full bg-accent" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
