/**
 * ThreeLedgerMotif — WCN's only permitted geometric signature (VS-06).
 *
 * Canonical construction (§02), replacing the old "1 spine + 3 nodes" figure
 * which invented a second geometry (motif-law violation H-2):
 *   · 3 co-equal horizontal lines (Project / Capital / Proof) — neutral ink,
 *     NEVER bronze, equal length / weight / spacing.
 *   · 1 verification node — solid BRONZE — on the CENTER (Capital) line only.
 *   · 1 vertical dashed reconciliation line — bronze — crossing all three
 *     ("the same transaction, verified across three ledgers").
 *
 * Every instance binds a `data-motif` semantic (§06). Decorative → aria-hidden.
 */
type Props = {
  /** The verification relationship this instance asserts (motif law §06). */
  motif?: "verification" | "divider";
  labels?: [string, string, string];
  animated?: boolean;
  caption?: string;
  className?: string;
};

export function ThreeLedgerMotif({
  motif = "verification",
  labels,
  animated = false,
  caption,
  className,
}: Props) {
  const xL = 70;
  const xR = 650;
  const xNode = 360;
  const yProject = 64;
  const yCapital = 110; // center line — the node always lands here
  const yProof = 156;

  return (
    <div className={`tlm${className ? ` ${className}` : ""}`} data-motif={motif} aria-hidden>
      <svg viewBox="0 0 720 200" width="100%" preserveAspectRatio="xMidYMid meet" className="tlm-svg">
        {/* three co-equal ledger lines — neutral, never bronze */}
        <line x1={xL} y1={yProject} x2={xR} y2={yProject} className="tlm-line" />
        <line x1={xL} y1={yCapital} x2={xR} y2={yCapital} className="tlm-line" />
        <line x1={xL} y1={yProof} x2={xR} y2={yProof} className="tlm-line" />

        {/* vertical reconciliation dash — bronze, crosses all three lines */}
        <line x1={xNode} y1={yProject - 16} x2={xNode} y2={yProof + 16} className="tlm-dash" />

        {/* travelling verification pulse on the center line (hero only) */}
        {animated ? <circle cx={xL} cy={yCapital} r="4" className="tlm-pulse" /> : null}

        {/* verification node — bronze — on the center (Capital) line */}
        <circle cx={xNode} cy={yCapital} r="6.5" className="tlm-node" />

        {labels ? (
          <>
            <text x={xL} y={yProject - 14} className="tlm-label">{labels[0]}</text>
            <text x={xL} y={yCapital - 14} className="tlm-label">{labels[1]}</text>
            <text x={xL} y={yProof - 14} className="tlm-label">{labels[2]}</text>
          </>
        ) : null}
      </svg>
      {caption ? <p className="tlm-caption">{caption}</p> : null}
    </div>
  );
}
