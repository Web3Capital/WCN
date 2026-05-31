/**
 * WcnIcon — a small bespoke icon set drawn to the VS-05 spec, replacing the
 * third-party lucide icons on marketing surfaces (defect H2-2 / H-3).
 *
 * VS-05 contract: 24×24 grid · ~20×20 live area · stroke-width 2 · square caps ·
 * miter joins · fill none · `currentColor` (so it inherits text/authority color).
 * Linear, monochrome, institutional — no gradient/shadow/skeuomorphism.
 *
 * Home loop set: node · deal · task · proof · settle.
 */
import type { ReactNode } from "react";

type IconName =
  | "node" | "deal" | "task" | "proof" | "settle"
  | "menu" | "close" | "chevron"
  | "sun" | "moon" | "monitor";

const PATHS: Record<IconName, ReactNode> = {
  // operator in a network — a node with four connections
  node: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 9.5V5M12 14.5V19M9.5 12H5M14.5 12H19" />
    </>
  ),
  // a deal — two parties joined
  deal: (
    <>
      <circle cx="7" cy="12" r="2.5" />
      <circle cx="17" cy="12" r="2.5" />
      <path d="M9.5 12h5" />
    </>
  ),
  // task — a scoped work sheet
  task: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 9h6M9 12.5h6M9 16h4" />
    </>
  ),
  // proof — a sealed frame with a verification check (takes bronze when authority)
  proof: (
    <>
      <path d="M5 5h14v14H5z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  // settlement — a balance
  settle: (
    <>
      <path d="M12 5v14M7 19h10" />
      <path d="M5 9h14" />
      <path d="M5 9l-2 4h4z" />
      <path d="M19 9l-2 4h4z" />
    </>
  ),
  // ── interface group ──
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  // ── theme group ──
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 119.5 4 6.2 6.2 0 0020 14.5z" />,
  monitor: (
    <>
      <path d="M3 5h18v11H3z" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
};

export function WcnIcon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
