"use client";

import { useEffect } from "react";

/**
 * AnimationBudget — pauses heavy decorative animations when their host
 * sections are scrolled out of view. Reduces wasted paint and battery on
 * long visits, addressing the "10 concurrent animations idle" finding from
 * the home-page stress test.
 *
 * Strategy: each section that owns animation (hero, ticker, ledgers-in-motion)
 * is an IntersectionObserver target. When intersectionRatio < 0.05, set
 * `data-anim-paused="true"` on it; CSS rule pauses keyframes inside.
 *
 * Renders nothing — pure side-effect.
 */
export function AnimationBudget() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = document.querySelectorAll<HTMLElement>("[data-anim-host]");
    if (targets.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          el.dataset.animPaused = entry.intersectionRatio < 0.05 ? "true" : "false";
        }
      },
      { threshold: [0, 0.05, 0.5] },
    );
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, []);

  return null;
}
