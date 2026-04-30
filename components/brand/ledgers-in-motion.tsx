/**
 * LedgersInMotion — signature visualization for the WCN home page.
 *
 * Distilled to six elements after design review:
 *   1. The spine (gradient-rendered capital flow channel)
 *   2-4. Three ledger nodes (Registry / Capital / Settlement)
 *   5. A single voltage pulse traveling the spine
 *   6. Three uppercase-mono labels under the nodes
 *
 * No more aura, halo, or receipt cards — they were noise. What remains
 * is instrument-grade and reads at a glance. Each node responds to hover
 * with a focus halo and a status caption.
 *
 * Pure SVG/CSS. Honors prefers-reduced-motion.
 */

type Props = { caption?: string };

export function LedgersInMotion({ caption }: Props) {
  return (
    <div className="ledgers-in-motion" aria-hidden>
      <svg
        viewBox="0 0 720 220"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        className="lim-stage"
      >
        <defs>
          <linearGradient id="lim-spine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--ledger-node)" stopOpacity="0" />
            <stop offset="18%" stopColor="var(--ledger-node)" stopOpacity="0.7" />
            <stop offset="50%" stopColor="var(--ledger-deal)" stopOpacity="0.7" />
            <stop offset="82%" stopColor="var(--ledger-settle)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--ledger-settle)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* The spine — capital flow channel */}
        <line x1="80" y1="110" x2="640" y2="110" stroke="var(--line-strong)" strokeWidth="0.5" strokeDasharray="2 6" />
        <line x1="80" y1="110" x2="640" y2="110" stroke="url(#lim-spine)" strokeWidth="2" />

        {/* Single voltage pulse traveling the spine */}
        <circle cx="80" cy="110" r="4" fill="var(--voltage-500)" className="lim-pulse" />

        {/* Three ledger nodes */}
        <g className="lim-node lim-node-1">
          <circle cx="120" cy="110" r="32" fill="color-mix(in oklab, var(--ledger-node) 8%, transparent)" stroke="var(--ledger-node)" strokeWidth="1" />
          <circle cx="120" cy="110" r="5" fill="var(--ledger-node)" />
          <text x="120" y="166" textAnchor="middle" className="lim-label">REGISTRY</text>
        </g>
        <g className="lim-node lim-node-2">
          <circle cx="360" cy="110" r="36" fill="color-mix(in oklab, var(--ledger-deal) 8%, transparent)" stroke="var(--ledger-deal)" strokeWidth="1" />
          <circle cx="360" cy="110" r="6" fill="var(--ledger-deal)" />
          <text x="360" y="170" textAnchor="middle" className="lim-label">CAPITAL</text>
        </g>
        <g className="lim-node lim-node-3">
          <circle cx="600" cy="110" r="32" fill="color-mix(in oklab, var(--ledger-settle) 8%, transparent)" stroke="var(--ledger-settle)" strokeWidth="1" />
          <circle cx="600" cy="110" r="5" fill="var(--ledger-settle)" />
          <text x="600" y="166" textAnchor="middle" className="lim-label">SETTLEMENT</text>
        </g>
      </svg>

      {caption ? <p className="ledgers-in-motion-caption">{caption}</p> : null}
    </div>
  );
}
