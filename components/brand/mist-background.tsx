"use client";

import { useEffect, useRef } from "react";

/**
 * MistBackground — a soft cloud/mist field behind the page that gathers
 * gently toward the cursor. One fixed layer (not per-section decoration), in
 * the bronze/ink palette only, eased so it drifts like fog rather than snapping.
 *
 * Respects prefers-reduced-motion (no follow, no ambient drift — a static
 * field). The rAF loop runs only while catching up to the pointer, then stops.
 */
export function MistBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 50;
    let targetY = 32;
    let curX = 50;
    let curY = 32;
    let raf = 0;

    const tick = () => {
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;
      el.style.setProperty("--mist-x", `${curX.toFixed(2)}%`);
      el.style.setProperty("--mist-y", `${curY.toFixed(2)}%`);
      if (Math.abs(targetX - curX) > 0.04 || Math.abs(targetY - curY) > 0.04) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="mist-bg" aria-hidden />;
}
