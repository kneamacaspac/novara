// Shared look for the cards on the Dashboard (dark glass, big rounded corners)
export const dashCard =
  "min-h-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#1b1b1b]/85 backdrop-blur-md";

// Colors offered when customizing folders and notebook items
export const PALETTE = [
  "#7c6cff",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

// Soft tinted background and border for a color (works with 6-digit hex colors)
export const tintStyle = (color) =>
  color ? { background: `${color}26`, border: `1px solid ${color}66` } : {};
