"use client";

import { useEffect } from "react";

/**
 * ReadingProgress — single thin voltage line at the very top of the
 * viewport, growing from 0 → 100% as the user scrolls through #main-content.
 *
 * Visual is owned by `.reading-progress` in globals.css; this component
 * just keeps the `--reading-progress` custom property in sync with scroll.
 *
 * Disables itself when:
 *   • content is too short to scroll (<200px overflow)
 *   • user prefers reduced motion (line still appears but no scroll listener)
 *
 * Uses a rAF-throttled scroll listener — one paint per frame, even on
 * fast trackpads. Cheaper than continuous transforms.
 */
export function ReadingProgress() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const bar = document.createElement("div");
    bar.className = "reading-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable < 200) {
        bar.style.setProperty("--reading-progress", "0");
        return;
      }
      const pct = Math.min(1, Math.max(0, window.scrollY / scrollable));
      bar.style.setProperty("--reading-progress", String(pct));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
      bar.remove();
    };
  }, []);

  return null;
}
