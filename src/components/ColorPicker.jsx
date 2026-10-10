import { Ban } from "lucide-react";
import { PALETTE } from "../lib/ui";

// Ready-made colors, plus a rainbow circle that opens the browser's color picker.
// allowNone adds a "no color" choice (value becomes null).
export default function ColorPicker({ value, onChange, allowNone = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {allowNone && (
        <button
          type="button"
          onClick={() => onChange(null)}
          title="No color"
          className={`grid h-3 w-3 place-items-center rounded-full border-2 text-white/60 ${!value ? "border-white" : "border-white/20"}`}
        >
          <Ban size={8} />
        </button>
      )}
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          title={c}
          className={`h-3 w-3 rounded-full border-2 ${value === c ? "border-white" : "border-transparent"}`}
          style={{ background: c }}
        />
      ))}
      <label
        className="relative h-3 w-3 cursor-pointer overflow-hidden rounded-full border border-white/20"
        title="Custom color"
      >
        <span
          className="block h-full w-full"
          style={{
            background:
              "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
          }}
        />
        <input
          type="color"
          value={value || "#7c6cff"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
