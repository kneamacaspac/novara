import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import ReaderShell, { useTool } from "./ReaderShell";
import DictionaryMenu from "./DictionaryMenu";
import { useReadingSession } from "../hooks/useReadingSession";
import { saveProgress } from "../services/progressService";
import { addBookmark } from "../services/bookmarkService";
import { addHighlight, deleteHighlight } from "../services/highlightService";
import { updateBook } from "../services/bookService";

// Turns the nested table of contents into one flat list
function flattenToc(items, out = []) {
  for (const it of items) {
    out.push({ label: it.label.trim(), target: it.href });
    if (it.subitems && it.subitems.length) flattenToc(it.subitems, out);
  }
  return out;
}

export default function EpubReader({ book, startAt }) {
  const viewer = useRef(null);
  const rendition = useRef(null);
  const current = useRef({ cfi: startAt, pct: 0 });
  const rendered = useRef(new Map());
  const pagesRef = useRef(book.pages);
  const tools = useTool();
  const session = useReadingSession(book.id);
  const [toc, setToc] = useState([]);
  const [percent, setPercent] = useState(0);
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(null);
  const highlights = useLiveQuery(
    () => db.highlights.where("bookId").equals(book.id).toArray(),
    [book.id],
    [],
  );

  // 1. Open the book
  useEffect(() => {
    let cancelled = false;
    let b;
    let onKey;

    (async () => {
      const buffer = await book.file.arrayBuffer();
      if (cancelled) return;
      b = ePub(buffer);
      const r = b.renderTo(viewer.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "auto",
      });
      rendition.current = r;

      r.themes.default({
        body: {
          color: "#111",
          background: "#fff",
          "font-family": "Georgia, serif",
          "line-height": "1.7",
        },
      });

      // Right-click on selected text opens the dictionary menu.
      // The book is inside an iframe, so we add the iframe position to the click position.
      r.hooks.content.register((contents) => {
        contents.document.addEventListener("contextmenu", (e) => {
          const text = contents.window.getSelection().toString().trim();
          if (!text) return;
          e.preventDefault();
          const frame = contents.window.frameElement.getBoundingClientRect();
          setMenu({
            x: frame.left + e.clientX,
            y: frame.top + e.clientY,
            text,
          });
        });
      });

      // Runs after every page turn
      r.on("relocated", (loc) => {
        const cfi = loc.start.cfi;
        const hasLocations = b.locations.length() > 0;
        const pct = hasLocations
          ? b.locations.percentageFromCfi(cfi)
          : current.current.pct;
        const delta = (pct - current.current.pct) * (pagesRef.current || 0);
        if (delta > 0 && delta < 15) session.addPages(delta); // ignore big jumps (chapter skips)
        current.current = { cfi, pct };
        setPercent(pct);
        session.touch();
        saveProgress(book.id, cfi, hasLocations ? pct : undefined);
      });

      // Text selected while a highlight or underline tool is active
      r.on("selected", async (cfiRange, contents) => {
        const { tool, color } = tools.ref.current;
        if (tool !== "highlight" && tool !== "underline") return;
        const range = await b.getRange(cfiRange);
        await addHighlight({
          bookId: book.id,
          location: cfiRange,
          text: range.toString(),
          color,
          kind: tool,
        });
        contents.window.getSelection().removeAllRanges();
      });

      onKey = (e) => {
        if (e.target.tagName === "INPUT") return;
        if (e.key === "ArrowRight") r.next();
        if (e.key === "ArrowLeft") r.prev();
      };
      r.on("keyup", onKey);
      window.addEventListener("keyup", onKey);

      // Load the cached page map BEFORE displaying, so the first percentage is correct
      if (book.locations) b.locations.load(book.locations);

      await r.display(startAt || undefined);
      if (cancelled) return;
      setReady(true);
      b.loaded.navigation.then((nav) => setToc(flattenToc(nav.toc)));

      // First time only: build the page map (a few seconds), then cache it in the database
      if (!book.locations) {
        await b.ready;
        await b.locations.generate(1024);
        const changes = { locations: b.locations.save() };
        if (!book.pages) {
          changes.pages = Math.round(b.locations.length() * 0.55); // rough estimate of printed pages
          pagesRef.current = changes.pages;
        }
        updateBook(book.id, changes);
        const cfi = current.current.cfi;
        if (cfi) {
          const pct = b.locations.percentageFromCfi(cfi);
          current.current.pct = pct;
          setPercent(pct);
          saveProgress(book.id, cfi, pct);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("keyup", onKey);
      if (b) b.destroy();
      rendered.current.clear();
    };
  }, [book.id]);

  // 2. Draw saved highlights, and remove the ones that were deleted
  useEffect(() => {
    const r = rendition.current;
    if (!r || !ready) return;
    const ids = new Set(highlights.map((h) => h.id));
    for (const [id, h] of rendered.current) {
      if (!ids.has(id)) {
        r.annotations.remove(h.location, h.kind);
        rendered.current.delete(id);
      }
    }
    for (const h of highlights) {
      if (rendered.current.has(h.id) || h.kind === "pen") continue;
      const style =
        h.kind === "underline"
          ? { stroke: h.color, "stroke-width": "2" }
          : {
              fill: h.color,
              "fill-opacity": "0.4",
              "mix-blend-mode": "multiply",
            };
      const onClick = () => {
        if (confirm("Remove this " + h.kind + "?")) deleteHighlight(h.id);
      };
      r.annotations[h.kind](h.location, { id: h.id }, onClick, "hl", style);
      rendered.current.set(h.id, h);
    }
  }, [highlights, ready]);

  function bookmark() {
    const { cfi, pct } = current.current;
    const pageNo = pagesRef.current
      ? Math.max(1, Math.round(pct * pagesRef.current))
      : null;
    addBookmark({
      bookId: book.id,
      location: cfi,
      page: pageNo,
      percent: pct,
      label: pageNo
        ? `Page ${pageNo} (${Math.round(pct * 100)}%)`
        : `${Math.round(pct * 100)}%`,
    });
  }

  return (
    <ReaderShell
      book={book}
      toc={toc}
      tools={tools}
      percent={percent}
      onGoTo={(t) => rendition.current && rendition.current.display(t)}
      onBookmark={bookmark}
      onPrev={() => rendition.current && rendition.current.prev()}
      onNext={() => rendition.current && rendition.current.next()}
    >
      <div
        ref={viewer}
        className="mx-auto h-full w-full max-w-6xl bg-white shadow"
      />
      <DictionaryMenu menu={menu} onClose={() => setMenu(null)} />
    </ReaderShell>
  );
}
