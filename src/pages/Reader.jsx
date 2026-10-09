import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getBook } from "../services/bookService";
import { getProgress } from "../services/progressService";
import EpubReader from "../reader/EpubReader";
import PdfReader from "../reader/PdfReader";

export default function Reader() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      const book = await getBook(id);
      if (!book) {
        setState({ missing: true });
        return;
      }
      const progress = await getProgress(book.id);
      setState({
        book,
        startAt: params.get("at") || progress?.location || null,
      });
    })();
  }, [id]);

  if (!state) return <div className="p-8">Loading...</div>;
  if (state.missing) return <div className="p-8">Book not found.</div>;
  const Comp = state.book.type === "pdf" ? PdfReader : EpubReader;
  return <Comp key={state.book.id} book={state.book} startAt={state.startAt} />;
}
