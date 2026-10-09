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
  // Icons only by default (like the mockup). The tab on the sidebar edge shows the labels.
  const [open, setOpen] = useState(
    () => localStorage.getItem("sidebar") === "open",
  );

  // A page can set a blurred cover that shows behind the whole app, sidebar included.
  // The Dashboard uses this; other pages leave it empty.
  const [backdrop, setBackdrop] = useState(null);

  const toggle = () => {
    localStorage.setItem("sidebar", open ? "closed" : "open");
    setOpen(!open);
  };

  const item = ({ isActive }) =>
    `flex items-center gap-4 rounded-full transition ${
      open ? "px-5 py-4" : "mx-auto h-[2.5rem] w-[2.5rem] justify-center"
    } ${isActive ? "bg-white/15" : "hover:bg-white/10"}`;

  return (
    <div className="relative flex h-full overflow-hidden">
      {backdrop && (
        <>
          <img
            src={backdrop}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/40" />
        </>
      )}

      <aside
        className={`relative z-20 flex shrink-0 flex-col justify-between border-r border-white/10 pb-8 pt-8 transition-all ${
          open ? "w-60 px-4" : "w-15"
        } ${backdrop ? "bg-white/5 backdrop-blur-xl" : "bg-panel"}`}
      >
        <nav className="flex flex-col gap-5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={item}
              title={label}
            >
              <Icon size={20} strokeWidth={2.2} />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/settings" className={item} title="Settings">
          <Settings size={20} strokeWidth={2.2} />
          {open && <span>Settings</span>}
        </NavLink>

        <button
          onClick={toggle}
          title={open ? "Hide labels" : "Show labels"}
          className="absolute left-full top-1/2 grid h-16 w-12 -translate-y-1/2 place-items-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md hover:bg-white/20"
        >
          <ChevronLeft size={28} />
        </button>
      </aside>

      <main className="relative z-10 h-full min-w-0 flex-1 overflow-y-auto">
        <Outlet context={{ setBackdrop }} />
      </main>
    </div>
  );
}
