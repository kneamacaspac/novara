export default function DictionaryMenu({ menu, onClose }) {
  if (!menu) return null;
  const word = menu.text.trim();
  const first = word.split(" ")[0];
  const open = (url) => {
    window.open(url, "_blank", "noopener");
    onClose();
  };
  const item = "block w-full px-4 py-2 text-left hover:bg-white/10";

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="absolute w-56 overflow-hidden rounded-xl border border-white/10 bg-panel text-sm text-white shadow-2xl"
        style={{ left: menu.x, top: menu.y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate border-b border-white/10 px-4 py-2 text-white/60">
          {word}
        </div>
        <button
          className={item}
          onClick={() =>
            open(
              `https://www.google.com/search?q=${encodeURIComponent("define " + word)}`,
            )
          }
        >
          Search on Google
        </button>
        <button
          className={item}
          onClick={() =>
            open(
              `https://www.merriam-webster.com/dictionary/${encodeURIComponent(first)}`,
            )
          }
        >
          Merriam-Webster
        </button>
      </div>
    </div>
  );
}
