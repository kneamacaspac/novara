import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "pdfjs-dist/web/pdf_viewer.css";
import { useLiveQuery } from "dexie-react-hooks";
import { ZoomIn, ZoomOut } from "lucide-react";
import { db } from "../db";
import ReaderShell, { useTool } from "./ReaderShell";
import DictionaryMenu from "./DictionaryMenu";
import PdfPage from "./PdfPage";
import { useReadingSession } from "../hooks/useReadingSession";
import { saveProgress } from "../services/progressService";
import { addBookmark } from "../services/bookmarkService";
import { undoLastPen } from "../services/highlightService";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Turns the PDF outline into a flat list of { label, target: pageNumber }
async function flattenOutline(pdf, items, out = []) {
  for (const it of items) {
    try {
      const dest =
        typeof it.dest === "string"
          ? await pdf.getDestination(it.dest)
          : it.dest;
      const index = await pdf.getPageIndex(dest[0]);
      out.push({ label: it.title, target: index + 1 });
    } catch (e) {
      // some outline entries have no valid destination; skip them
    }
    if (it.items && it.items.length) await flattenOutline(pdf, it.items, out);
  }
  return out;
}

export default function PdfReader({ book, startAt }) {
  const [pdf, setPdf] = useState(null);
  const [toc, setToc] = useState([]);
  const [page, setPage] = useState(Math.max(1, Number(startAt) || 1));
  const [scale, setScale] = useState(1.3);
  const [menu, setMenu] = useState(null);
  const lastPage = useRef(page);
  const tools = useTool();
  const session = useReadingSession(book.id);
  const highlights = useLiveQuery(
    () => db.highlights.where("bookId").equals(book.id).toArray(),
    [book.id],
    [],
  );

  // Load the PDF
  useEffect(() => {
    let task;
    let cancelled = false;
    (async () => {
      try {
        task = pdfjsLib.getDocument({ data: await book.file.arrayBuffer() });
        const doc = await task.promise;
        if (cancelled) return;
        setPdf(doc);
        const outline = await doc.getOutline();
        const items = outline ? await flattenOutline(doc, outline) : [];
        // No outline in this PDF? Fall back to a plain list of pages
        setToc(
          items.length
            ? items
            : Array.from({ length: doc.numPages }, (_, i) => ({
                label: `Page ${i + 1}`,
                target: i + 1,
              })),
        );
      } catch (e) {
        if (!cancelled) console.error("Could not open PDF", e);
      }
    })();
    return () => {
      cancelled = true;
      if (task) task.destroy();
    };
  }, [book.id]);

  const total = pdf ? pdf.numPages : 1;
  const percent = total > 1 ? (page - 1) / (total - 1) : 0;
  const goTo = (n) => setPage(Math.min(Math.max(1, Number(n) || 1), total));

  // Save progress and count pages whenever the page changes
  useEffect(() => {
    if (!pdf) return;
    saveProgress(book.id, String(page), percent);
    const delta = page - lastPage.current;
    if (delta > 0 && delta <= 3) session.addPages(delta);
    lastPage.current = page;
    session.touch();
  }, [page, pdf]);

  // Arrow keys
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown")
        setPage((p) => Math.min(p + 1, total));
      if (e.key === "ArrowLeft" || e.key === "PageUp")
        setPage((p) => Math.max(p - 1, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  if (!pdf) return <div className="p-8">Loading...</div>;

  const bookmark = () =>
    addBookmark({
      bookId: book.id,
      location: String(page),
      page,
      percent,
      label: `Page ${page}`,
    });

  const iconBtn = "rounded-lg p-2 hover:bg-black/10";

  return (
    <ReaderShell
      book={book}
      toc={toc}
      tools={tools}
      percent={percent}
      penEnabled
      onGoTo={goTo}
      onBookmark={bookmark}
      onPrev={() => goTo(page - 1)}
      onNext={() => goTo(page + 1)}
      onUndoPen={() => undoLastPen(book.id, page)}
      extra={
        <>
          <input
            type="number"
            value={page}
            min={1}
            max={total}
            onChange={(e) => goTo(e.target.value)}
            className="w-16 rounded border border-black/20 px-2 py-1 text-sm"
          />
          <span className="mr-2 text-sm">/ {total}</span>
          <button
            className={iconBtn}
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
          >
            <ZoomOut size={18} />
          </button>
          <button
            className={iconBtn}
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          >
            <ZoomIn size={18} />
          </button>
        </>
      }
    >
      <div className="h-full overflow-auto bg-[#d8d8d8] p-6">
        <PdfPage
          pdf={pdf}
          pageNo={page}
          scale={scale}
          bookId={book.id}
          tools={tools}
          highlights={highlights}
          onMenu={setMenu}
        />
      </div>
      <DictionaryMenu menu={menu} onClose={() => setMenu(null)} />
    </ReaderShell>
  );
}
