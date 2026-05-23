"use client";

import { useEffect } from "react";

/**
 * ScrollReveal — single global IntersectionObserver that activates any
 * element marked with `data-reveal` once it enters the viewport. The
 * animation itself is defined in CSS (see `[data-reveal]` rules in
 * globals.css). This file just flips the `data-revealed` flag.
 *
 * Two ways to opt in:
 *   1. Explicit — add `data-reveal` (or `data-reveal="fade"|"draw"|...`)
 *      to any element. Wrap siblings in `data-reveal-group` for
 *      auto-stagger via --reveal-i × 80ms.
 *   2. Implicit — any `.section-head` and `.card-grid-animated` is
 *      auto-promoted to a reveal-group, and its direct children get
 *      `data-reveal` if they don't already have one. This is how we
 *      avoid sprinkling data-* across every page.
 *
 * Honors prefers-reduced-motion. Once-only — release after activation.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Auto-promote known container patterns ────────────────
    // .section-head: stagger eyebrow → h2/h1 → lede
    // .card-grid-animated: stagger each card across the grid
    // .flow / .loop-flow / .hiw-loop / .grid-3 step grids: same
    // Note: .card-grid-animated and .docs-card-grid have their own
    // `cardFadeUp` keyframe stagger that fires on mount. We don't auto-
    // tag their children to avoid double-animation. Anything that needs
    // viewport-gated entry instead uses one of the selectors below.
    const autoGroupSelectors = [
      ".section-head",
      ".hiw-glance-list",
      ".about-pillars-list-v2",
      ".about-measure-list-v2",
      ".apply-steps",
      ".apply-node-types",
      ".architecture-grade-inner",
    ];
    const viewportH = window.innerHeight;
    autoGroupSelectors.forEach((sel) => {
      document
        .querySelectorAll<HTMLElement>(sel + ":not([data-reveal-group])")
        .forEach((host) => {
          host.dataset.revealGroup = "";
          // If the host is already in or above the viewport at mount, we
          // skip the animation entirely — the user has not had a chance
          // to "scroll to" it, so revealing would just feel like a flash.
          const rect = host.getBoundingClientRect();
          const alreadyVisible = rect.top < viewportH * 0.95;
          const children = host.querySelectorAll<HTMLElement>(":scope > *");
          children.forEach((child) => {
            if (
              !child.hasAttribute("data-reveal") &&
              !child.classList.contains("editorial-masthead-rule") &&
              !child.classList.contains("editorial-masthead-rule-end") &&
              child.getAttribute("aria-hidden") !== "true"
            ) {
              child.setAttribute("data-reveal", "");
              if (alreadyVisible) {
                child.dataset.revealed = "true";
              }
            }
          });
        });
    });

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (targets.length === 0) return;

    // Assign stagger index inside any reveal-group.
    document
      .querySelectorAll<HTMLElement>("[data-reveal-group]")
      .forEach((group) => {
        const children = group.querySelectorAll<HTMLElement>(":scope > [data-reveal]");
        children.forEach((child, i) => {
          if (!child.style.getPropertyValue("--reveal-i")) {
            child.style.setProperty("--reveal-i", String(i));
          }
        });
      });

    // Safety: if the runtime viewport is degenerate (0, hidden tab,
    // headless preview without a layout viewport, or no IO), just
    // reveal everything immediately so the page is never stuck blank.
    if (
      reduced ||
      typeof IntersectionObserver === "undefined" ||
      window.innerHeight < 64
    ) {
      targets.forEach((el) => {
        el.dataset.revealed = "true";
      });
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            // tiny rAF so the transition runs from the idle state
            requestAnimationFrame(() => {
              el.dataset.revealed = "true";
            });
            obs.unobserve(el);
          }
        }
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return null;
}
