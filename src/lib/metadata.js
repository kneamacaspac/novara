import ePub from "epubjs";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const stripHtml = (s) => (s || "").replace(/<[^>]+>/g, "");

async function readEpubMeta(file) {
  const book = ePub(await file.arrayBuffer());
  const meta = await book.loaded.metadata;
  let cover = null;
  try {
    const url = await book.coverUrl();
    if (url) cover = await (await fetch(url)).blob();
  } catch (e) {
    console.warn("No cover found", e);
  }
  book.destroy();
  return {
    title: meta.title,
    author: meta.creator,
    synopsis: stripHtml(meta.description),
    published: meta.pubdate ? meta.pubdate.slice(0, 10) : "",
    pages: 0, // EPUBs have no real pages; the reader estimates this later
    cover,
  };
}

async function readPdfMeta(file) {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() })
    .promise;
  const info = (await pdf.getMetadata()).info || {};
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.8 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport })
    .promise;
  const cover = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8),
  );
  const pages = pdf.numPages;
  pdf.destroy();
  return { title: info.Title, author: info.Author, pages, cover };
}

export async function readMeta(file) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const meta = isPdf ? await readPdfMeta(file) : await readEpubMeta(file);
  const fallbackTitle = file.name.slice(0, file.name.lastIndexOf("."));
  return {
    ...meta,
    type: isPdf ? "pdf" : "epub",
    title: meta.title || fallbackTitle,
  };
}
