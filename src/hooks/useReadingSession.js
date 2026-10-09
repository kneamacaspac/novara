import { useEffect, useRef } from "react";
import { addToSession } from "../services/sessionService";

const TICK_MS = 15000; // save every 15 seconds
const IDLE_MS = 5 * 60000; // stop counting after 5 minutes of no activity

export function useReadingSession(bookId) {
  const pages = useRef(0);
  const lastActive = useRef(Date.now());
  const touch = () => {
    lastActive.current = Date.now();
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart", "wheel"];
    events.forEach((e) => window.addEventListener(e, touch));
    const timer = setInterval(() => {
      const active =
        document.visibilityState === "visible" &&
        Date.now() - lastActive.current < IDLE_MS;
      if (!active) return;
      const p = pages.current;
      pages.current = 0;
      addToSession(bookId, TICK_MS / 60000, p);
    }, TICK_MS);
    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [bookId]);

  return {
    touch,
    addPages: (n) => {
      pages.current += n;
    },
  };
}
