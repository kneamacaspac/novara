import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  NotebookPen,
  Library,
  TrendingUp,
  Settings,
  ChevronLeft,
} from "lucide-react";

const links = [
  { to: "/", icon: LayoutGrid, label: "Dashboard" },
  { to: "/notebook", icon: NotebookPen, label: "Notebook" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/tracker", icon: TrendingUp, label: "Reading Tracker" },
];

export default function Layout() {
  const [open, setOpen] = useState(
    () => localStorage.getItem("sidebar") !== "closed",
  );

  const toggle = () => {
    localStorage.setItem("sidebar", open ? "closed" : "open");
    setOpen(!open);
  };

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 transition ${isActive ? "bg-white/15" : "hover:bg-white/10"}`;

  return (
    <div className="flex h-full">
      <aside
        className={`relative flex shrink-0 flex-col justify-between border-r border-line bg-panel p-3 transition-all ${open ? "w-56" : "w-16"}`}
      >
        <nav className="flex flex-col gap-2">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} className={item}>
              <Icon size={20} />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/settings" className={item}>
          <Settings size={20} />
          {open && <span>Settings</span>}
        </NavLink>
        <button
          onClick={toggle}
          className="absolute -right-3 top-1/2 grid h-6 w-6 place-items-center rounded-full border border-line bg-panel2"
        >
          <ChevronLeft size={14} className={open ? "" : "rotate-180"} />
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
