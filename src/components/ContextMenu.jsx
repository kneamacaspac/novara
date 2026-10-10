import { useLayoutEffect, useEffect, useRef, useState } from "react";

// Usage:
//   const ctx = useContextMenu();
//   <div onContextMenu={(e) => ctx.open(e, [{ label: 'Delete', icon: Trash2, danger: true, onClick: () => ... }])} />
//   <ContextMenu menu={ctx.menu} onClose={ctx.close} />
export function useContextMenu() {
  const [menu, setMenu] = useState(null);
  const open = (e, items) => {
    e.preventDefault(); // stops the browser's own right-click menu
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };
  return { menu, open, close: () => setMenu(null) };
}

export default function ContextMenu({ menu, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  // Measure the menu before it is painted, and keep it inside the window
  useLayoutEffect(() => {
    if (!menu) {
      setPos(null);
      return;
    }
    const r = ref.current.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(menu.x, window.innerWidth - r.width - 8)),
      y: Math.max(8, Math.min(menu.y, window.innerHeight - r.height - 8)),
    });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
    };
  }, [menu]);

  if (!menu) return null;
  const at = pos || menu;

  return (
    // The full-screen layer catches any outside click or right-click and closes the menu
    <div
      className="fixed inset-0 z-[60]"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        ref={ref}
        className="absolute w-56 overflow-hidden rounded-xl border border-white/10 bg-panel py-1 text-sm text-white shadow-2xl"
        style={{ left: at.x, top: at.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {menu.items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.label}
              onClick={() => {
                onClose();
                it.onClick();
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/10 ${it.danger ? "text-red-400" : ""}`}
            >
              {Icon && <Icon size={16} />}
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
