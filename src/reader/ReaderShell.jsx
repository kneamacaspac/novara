import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Highlighter,
  Underline,
  PenLine,
  Undo2,
  Bookmark,
  Trash2,
} from "lucide-react";
import { db } from "../db";
import { deleteBookmark } from "../services/bookmarkService";

export const COLORS = ["#fde047", "#86efac", "#93c5fd", "#f9a8d4"];

// Holds the active tool and color. `ref` always has the latest values, which matters
// inside callbacks that are created only once (like epub.js events).
export function useTool() {
  const [tool, setTool] = useState("off"); // off | highlight | underline | pen
  const [color, setColor] = useState(COLORS[0]);
  const ref = useRef({ tool, color });
  ref.current = { tool, color };
  return { tool, setTool, color, setColor, ref };
}

export default function ReaderShell({
  book,
  toc,
  tools,
  percent,
  penEnabled,
  onGoTo,
  onBookmark,
  onPrev,
  onNext,
  onUndoPen,
  extra,
  children,
}) {
  const nav = useNavigate();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("chapters");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const bookmarks = useLiveQuery(
    () => db.bookmarks.where("bookId").equals(book.id).sortBy("createdAt"),
    [book.id],
    [],
  );

  const shownToc = toc.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toolBtn = (name, Icon) => (
    <button
      key={name}
      onClick={() => tools.setTool(tools.tool === name ? "off" : name)}
      className={`rounded-lg p-2 ${tools.tool === name ? "bg-black text-white" : "hover:bg-black/10"}`}
      title={name}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="flex h-full bg-[#e9e9e9] text-black">
      {open && (
        <aside className="flex w-64 shrink-0 flex-col bg-[#2b2b2b] text-white">
          <div className="flex items-center gap-1 border-b border-white/10 p-2 text-sm">
            {["chapters", "bookmarks"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 capitalize ${tab === t ? "bg-white/15" : "text-white/60"}`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="ml-auto p-1"
            >
              <Search size={16} />
            </button>
          </div>
          {showSearch && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapters..."
              className="m-2 rounded bg-white/10 px-2 py-1 text-sm outline-none"
            />
          )}
          <div className="flex-1 overflow-y-auto">
            {tab === "chapters" &&
              shownToc.map((t, i) => (
                <button
                  key={i}
                  onClick={() => onGoTo(t.target)}
                  className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm hover:bg-white/10"
                >
                  {t.label}
                </button>
              ))}
            {tab === "bookmarks" && bookmarks.length === 0 && (
              <p className="p-4 text-sm text-white/50">No bookmarks yet.</p>
            )}
            {tab === "bookmarks" &&
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center border-b border-white/5 hover:bg-white/10"
                >
                  <button
                    onClick={() => onGoTo(b.location)}
                    className="flex-1 px-4 py-3 text-left text-sm"
                  >
                    {b.name || b.label || `Bookmark ${b.id}`}
                  </button>
                  <button
                    onClick={() => deleteBookmark(b.id)}
                    className="p-3 text-white/50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
          <button
            onClick={() => nav("/library")}
            className="border-t border-white/10 p-3 text-left text-sm hover:bg-white/10"
          >
            &lt; Back to Library
          </button>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-1 border-b border-black/10 bg-white px-3">
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 hover:bg-black/10"
          >
            <ChevronLeft size={18} className={open ? "" : "rotate-180"} />
          </button>
          <span className="ml-2 truncate text-sm font-medium">
            {book.title}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {extra}
            {toolBtn("highlight", Highlighter)}
            {toolBtn("underline", Underline)}
            {penEnabled && toolBtn("pen", PenLine)}
            {tools.tool === "pen" && (
              <button
                onClick={onUndoPen}
                className="rounded-lg p-2 hover:bg-black/10"
                title="Undo last stroke"
              >
                <Undo2 size={18} />
              </button>
            )}
            {tools.tool !== "off" &&
              COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => tools.setColor(c)}
                  className={`h-5 w-5 rounded-full border-2 ${tools.color === c ? "border-black" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            <button
              onClick={onBookmark}
              className="rounded-lg p-2 hover:bg-black/10"
              title="Bookmark this page"
            >
              <Bookmark size={18} />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1">{children}</div>

        <footer className="flex h-10 shrink-0 items-center justify-between border-t border-black/10 bg-white px-3 text-sm">
          <button onClick={onPrev} className="rounded-lg p-1 hover:bg-black/10">
            <ChevronLeft />
          </button>
          <span>{Math.round(percent * 100)}%</span>
          <button onClick={onNext} className="rounded-lg p-1 hover:bg-black/10">
            <ChevronRight />
          </button>
        </footer>
      </div>
    </div>
  );
}
