"use client";

import { useEffect } from "react";

type Props = {
  /**
   * CSS selector for the root inside which to spy headings.
   * Defaults to `.docs-article-body` (wiki articles).
   */
  scope?: string;
  /**
   * Selector(s) of headings to track. Defaults to h2, h3.
   */
  headings?: string;
  /**
   * Fraction of the viewport (0–1) at which a heading becomes "active"
   * once it crosses that line going up. 0.32 means the heading must
   * pass the upper third before being marked active — feels natural for
   * editorial long-form, where the reader's eye is roughly 1/3 down.
   */
  readingLine?: number;
};

/**
 * ActiveHeading — scroll-spy that flips `data-active="true"` on the
 * topmost heading inside a scope as the reader passes through it.
 *
 * Visuals live in globals.css: the active heading gets a voltage tick
 * on its left edge and slightly darker color. Combined with the global
 * ReadingProgress bar, this gives long-form pages an "editorial spine"
 * without overwhelming the typography.
 *
 * Uses a single scroll listener (rAF-throttled) over a static heading
 * list — cheaper than per-heading IntersectionObserver. Honors
 * prefers-reduced-motion: the data flag is still set (so the tick still
 * shows), but the underlying CSS transition is suppressed elsewhere.
 */
export function ActiveHeading({
  scope = ".docs-article-body",
  headings = "h2, h3",
  readingLine = 0.32,
}: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.querySelector(scope);
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(headings));
    if (els.length === 0) return;

    // Always mark each heading so CSS can render the inactive tick.
    els.forEach((el) => {
      el.dataset.spy = "true";
    });

    let active: HTMLElement | null = null;
    let raf = 0;

    const update = () => {
      raf = 0;
      const line = window.innerHeight * readingLine;
      let next: HTMLElement | null = null;
      // The topmost heading whose top is still above the reading line wins.
      for (const el of els) {
        const top = el.getBoundingClientRect().top;
        if (top <= line) next = el;
        else break;
      }
      if (next !== active) {
        if (active) active.removeAttribute("data-active");
        if (next) next.setAttribute("data-active", "true");
        active = next;
      }
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
      els.forEach((el) => {
        delete el.dataset.spy;
        el.removeAttribute("data-active");
      });
    };
  }, [scope, headings, readingLine]);

  return null;
}
