"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Target integer value to count up to. */
  value: number;
  /** Optional decimal places (default 0). */
  decimals?: number;
  /** Optional prefix (e.g. "$"). */
  prefix?: string;
  /** Optional suffix (e.g. "%" or "x"). */
  suffix?: string;
  /** Total animation duration in ms (default 1200). */
  duration?: number;
  /** Optional class name on the wrapper span. */
  className?: string;
  /** Use Intl number formatting (commas) — defaults to true. */
  format?: boolean;
};

/**
 * CounterNumber — IntersectionObserver-triggered count-up.
 *
 * Mounts at zero; once it enters the viewport, animates to `value` with
 * a cubic ease-out RAF loop. Then unobserves. Reduced motion: snaps
 * straight to the final value with no animation.
 *
 * Use for hero stats, dashboard counters, anything that should land
 * with weight rather than fade.
 */
export function CounterNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1200,
  className,
  format = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      if (reduced) {
        setDisplay(value);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        // ease-out cubic — lands soft, no overshoot
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(value * eased);
        if (p < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  const rendered = format
    ? display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : display.toFixed(decimals);

  return (
    <span ref={ref} className={className} data-counter>
      {prefix}
      {rendered}
      {suffix}
    </span>
  );
}
