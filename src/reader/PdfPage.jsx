import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { addHighlight } from "../services/highlightService";

export default function PdfPage({
  pdf,
  pageNo,
  scale,
  bookId,
  tools,
  highlights,
  onMenu,
}) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const textDiv = useRef(null);
  const penCanvas = useRef(null);
  const drawing = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const mine = highlights.filter((h) => h.page === pageNo);
  const strokes = mine.filter((h) => h.kind === "pen");
  const marks = mine.filter((h) => h.kind !== "pen");

  // 1. Draw the page image and the selectable text layer
  useEffect(() => {
    let task;
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNo);
      const vp = page.getViewport({ scale });
      const dpr = window.devicePixelRatio || 1;
      const c = canvas.current;
      c.width = vp.width * dpr;
      c.height = vp.height * dpr;
      c.style.width = `${vp.width}px`;
      c.style.height = `${vp.height}px`;
      setSize({ w: vp.width, h: vp.height });

      task = page.render({
        canvasContext: c.getContext("2d"),
        viewport: vp,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
      });
      try {
        await task.promise;
      } catch (e) {
        return;
      } // render was cancelled
      if (cancelled) return;

      const t = textDiv.current;
      t.innerHTML = "";
      t.style.setProperty("--scale-factor", scale);
      t.style.setProperty("--total-scale-factor", scale);
      const layer = new pdfjsLib.TextLayer({
        textContentSource: page.streamTextContent(),
        container: t,
        viewport: vp,
      });
      await layer.render();
    })();
    return () => {
      cancelled = true;
      if (task) task.cancel();
    };
  }, [pdf, pageNo, scale]);

  // 2. Pen: draw saved strokes (and the stroke being drawn right now)
  const paint = (extra) => {
    const c = penCanvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const all = strokes.map((s) => ({ color: s.color, points: s.data.points }));
    if (extra) all.push(extra);
    for (const s of all) {
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      s.points.forEach(([x, y], i) => {
        if (i) ctx.lineTo(x * c.width, y * c.height);
        else ctx.moveTo(x * c.width, y * c.height);
      });
      ctx.stroke();
    }
  };
  useEffect(() => {
    paint();
  }, [strokes.length, size.w, size.h, pageNo]);

  const point = (e) => {
    const r = penCanvas.current.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; // saved as 0 to 1
  };
  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = { color: tools.ref.current.color, points: [point(e)] };
  };
  const move = (e) => {
    if (!drawing.current) return;
    drawing.current.points.push(point(e));
    paint(drawing.current);
  };
  const up = () => {
    const s = drawing.current;
    drawing.current = null;
    if (s && s.points.length > 1) {
      addHighlight({
        bookId,
        location: String(pageNo),
        page: pageNo,
        kind: "pen",
        color: s.color,
        text: "",
        data: { points: s.points },
      });
    }
  };

  // 3. Highlight or underline the selected text
  const onMouseUp = () => {
    const { tool, color } = tools.ref.current;
    if (tool !== "highlight" && tool !== "underline") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !wrap.current.contains(sel.anchorNode))
      return;
    const box = wrap.current.getBoundingClientRect();
    const rects = [...sel.getRangeAt(0).getClientRects()]
      .filter((r) => r.width > 1)
      .map((r) => ({
        x: (r.left - box.left) / box.width,
        y: (r.top - box.top) / box.height,
        w: r.width / box.width,
        h: r.height / box.height,
      }));
    if (!rects.length) return;
    addHighlight({
      bookId,
      location: String(pageNo),
      page: pageNo,
      kind: tool,
      color,
      text: sel.toString(),
      data: { rects },
    });
    sel.removeAllRanges();
  };

  const onContextMenu = (e) => {
    const text = window.getSelection().toString().trim();
    if (!text) return;
    e.preventDefault();
    onMenu({ x: e.clientX, y: e.clientY, text });
  };

  return (
    <div
      ref={wrap}
      className="relative mx-auto bg-white shadow"
      style={{ width: size.w, height: size.h }}
      onMouseUp={onMouseUp}
      onContextMenu={onContextMenu}
    >
      <canvas ref={canvas} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0">
        {marks.flatMap((h) =>
          h.data.rects.map((r, i) => {
            const base = { left: `${r.x * 100}%`, width: `${r.w * 100}%` };
            const style =
              h.kind === "underline"
                ? {
                    ...base,
                    top: `${(r.y + r.h) * 100}%`,
                    height: 2,
                    background: h.color,
                  }
                : {
                    ...base,
                    top: `${r.y * 100}%`,
                    height: `${r.h * 100}%`,
                    background: h.color,
                    opacity: 0.4,
                    mixBlendMode: "multiply",
                  };
            return (
              <div key={`${h.id}-${i}`} className="absolute" style={style} />
            );
          }),
        )}
      </div>

      <div ref={textDiv} className="textLayer" />

      <canvas
        ref={penCanvas}
        width={size.w}
        height={size.h}
        className="absolute inset-0"
        style={{
          pointerEvents: tools.tool === "pen" ? "auto" : "none",
          touchAction: "none",
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
      />
    </div>
  );
}
