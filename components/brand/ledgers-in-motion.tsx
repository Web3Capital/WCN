/**
 * LedgersInMotion — Signature visualization for the WCN home page.
 *
 * A pure-SVG/CSS animation showing the three-ledger flow:
 *   Node (Civic Indigo)  →  Deal (Commerce Amber)  →  Settle (Verified Green)
 *
 * Design intent: an editorial, instrument-like diagram (think Bloomberg /
 * IBM annual report) — not a marketing toy. Capital pulses travel along the
 * spine; receipt cards drift in alternating direction; an audit halo rotates
 * at the center to suggest verification at every step.
 *
 * No external animation libs — pure CSS keyframes on top of inline SVG.
 * Honors prefers-reduced-motion via the @keyframes guard in globals.css.
 */

type Props = { caption?: string };

export function LedgersInMotion({ caption }: Props) {
  return (
    <div className="ledgers-in-motion" aria-hidden>
      <svg
        viewBox="0 0 720 280"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        className="lim-stage"
      >
        <defs>
          <linearGradient id="lim-spine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--ledger-node)" stopOpacity="0.0" />
            <stop offset="15%" stopColor="var(--ledger-node)" stopOpacity="0.85" />
            <stop offset="50%" stopColor="var(--ledger-deal)" stopOpacity="0.85" />
            <stop offset="85%" stopColor="var(--ledger-settle)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--ledger-settle)" stopOpacity="0.0" />
          </linearGradient>
          <radialGradient id="lim-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--voltage-500)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--voltage-500)" stopOpacity="0" />
          </radialGradient>
          <pattern id="lim-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeOpacity="0.05" />
          </pattern>
        </defs>

        {/* Background grid + glow */}
        <rect x="0" y="0" width="720" height="280" fill="url(#lim-grid)" className="lim-bg" />
        <circle cx="360" cy="140" r="180" fill="url(#lim-glow)" className="lim-aura" />

        {/* The spine — capital flow channel */}
        <line x1="80" y1="140" x2="640" y2="140" stroke="var(--line-strong)" strokeWidth="0.5" strokeDasharray="3 5" />
        <line x1="80" y1="140" x2="640" y2="140" stroke="url(#lim-spine)" strokeWidth="2" className="lim-spine" />

        {/* Pulse particles travelling along the spine */}
        <circle cx="80" cy="140" r="4" fill="var(--voltage-500)" className="lim-pulse lim-pulse-1" />
        <circle cx="80" cy="140" r="4" fill="var(--voltage-500)" className="lim-pulse lim-pulse-2" />
        <circle cx="80" cy="140" r="4" fill="var(--voltage-500)" className="lim-pulse lim-pulse-3" />

        {/* Three ledger nodes */}
        <g className="lim-node lim-node-1">
          <circle cx="120" cy="140" r="38" fill="color-mix(in oklab, var(--ledger-node) 12%, transparent)" stroke="var(--ledger-node)" strokeWidth="1" />
          <circle cx="120" cy="140" r="6" fill="var(--ledger-node)" />
          <text x="120" y="200" textAnchor="middle" className="lim-label">REGISTRY</text>
          <text x="120" y="216" textAnchor="middle" className="lim-sublabel">node admitted</text>
        </g>
        <g className="lim-node lim-node-2">
          <circle cx="360" cy="140" r="44" fill="color-mix(in oklab, var(--ledger-deal) 12%, transparent)" stroke="var(--ledger-deal)" strokeWidth="1" />
          <circle cx="360" cy="140" r="7" fill="var(--ledger-deal)" />
          {/* audit halo */}
          <g className="lim-halo">
            <circle cx="360" cy="140" r="56" fill="none" stroke="var(--voltage-500)" strokeWidth="0.5" strokeDasharray="2 4" strokeOpacity="0.6" />
          </g>
          <text x="360" y="206" textAnchor="middle" className="lim-label">CAPITAL</text>
          <text x="360" y="222" textAnchor="middle" className="lim-sublabel">deal matched</text>
        </g>
        <g className="lim-node lim-node-3">
          <circle cx="600" cy="140" r="38" fill="color-mix(in oklab, var(--ledger-settle) 12%, transparent)" stroke="var(--ledger-settle)" strokeWidth="1" />
          <circle cx="600" cy="140" r="6" fill="var(--ledger-settle)" />
          <text x="600" y="200" textAnchor="middle" className="lim-label">SETTLEMENT</text>
          <text x="600" y="216" textAnchor="middle" className="lim-sublabel">value allocated</text>
        </g>

        {/* Receipt callouts above and below the spine */}
        <g className="lim-receipt lim-receipt-top" transform="translate(180, 38)">
          <rect width="140" height="52" rx="6" fill="var(--card)" stroke="var(--line)" strokeWidth="0.5" />
          <text x="10" y="18" className="lim-receipt-id">NODE-0421</text>
          <text x="130" y="18" textAnchor="end" className="lim-receipt-status" fill="var(--ledger-node)">APPROVED</text>
          <line x1="10" y1="26" x2="130" y2="26" stroke="var(--line)" strokeDasharray="2 2" />
          <text x="10" y="40" className="lim-receipt-meta">Singapore · ops</text>
          <text x="130" y="40" textAnchor="end" className="lim-receipt-meta">tier 02</text>
        </g>
        <g className="lim-receipt lim-receipt-bot" transform="translate(420, 188)">
          <rect width="140" height="52" rx="6" fill="var(--card)" stroke="var(--line)" strokeWidth="0.5" />
          <text x="10" y="18" className="lim-receipt-id">SETTLE-9027</text>
          <text x="130" y="18" textAnchor="end" className="lim-receipt-status" fill="var(--ledger-settle)">CLEARED</text>
          <line x1="10" y1="26" x2="130" y2="26" stroke="var(--line)" strokeDasharray="2 2" />
          <text x="10" y="40" className="lim-receipt-meta">14 parties</text>
          <text x="130" y="40" textAnchor="end" className="lim-receipt-meta">$2.4M</text>
        </g>
      </svg>

      {caption && <p className="ledgers-in-motion-caption">{caption}</p>}
    </div>
  );
}
