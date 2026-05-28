/**
 * DualSlab — the "what X is / what X isn't" yes-no card pair.
 *
 * Phase 3 of the marketing redesign (see docs/marketing-redesign.md).
 *
 * Replaces three near-identical implementations:
 *   - /about's `.about-split-slab--yes/--no` (What WCN is / isn't)
 *   - /nodes's `.nodes-dual-card--yes/--no` (Nodes are / are not)
 *   - /pob's `.pob-bound-card--yes/--no` (Rewarded / Not rewarded)
 *
 * Each callsite had its own className prefix, three rebuilt-from-scratch
 * card layouts in CSS, and three sets of identical-looking number badges.
 *
 * Server component. The kicker labels (Affirmative / Negative, Rewarded /
 * Not rewarded, etc.) must come from `tCommon("common.editorial.*")` —
 * never pass an English string literal. See ADR-MR-005.
 */

import type { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Slab = {
  /** Kicker label above the title (compact variant only). Must be i18n. */
  kicker?: string;
  /** Slab heading. */
  title: string;
  /** Optional lede sentence under the title. */
  lede?: string;
  /** Big watermark number rendered behind the slab (feature variant only). */
  watermark?: string;
  /** List of bullet points. Rendered as `<ol>` in compact, `<ul>` in feature. */
  items: ReactNode[];
};

type Props = {
  affirm: Slab;
  deny: Slab;
  /**
   * Layout variant:
   * - `compact` (default): horizontal header (sigil + kicker + title + icon),
   *   numbered ordered list. Used by /nodes and /pob.
   * - `feature`: vertical header (icon on top, h3, lede), watermark behind,
   *   unordered list. Used by /about's "what WCN is / isn't" section.
   *
   * Each variant emits its own className family for visual styling.
   */
  variant?: "compact" | "feature";
  /**
   * Optional extra className appended to the grid wrapper. Use sparingly —
   * the variant already picks the right grid class.
   */
  gridClassName?: string;
};

export function DualSlab({ affirm, deny, variant = "compact", gridClassName }: Props) {
  if (variant === "feature") {
    const grid = `about-split-board grid-2 card-grid-animated${gridClassName ? ` ${gridClassName}` : ""}`;
    return (
      <div className={grid}>
        <FeatureSlab tone="affirm" slab={affirm} />
        <FeatureSlab tone="deny" slab={deny} />
      </div>
    );
  }
  const grid = `grid-2 dual-slab-grid card-grid-animated${gridClassName ? ` ${gridClassName}` : ""}`;
  return (
    <div className={grid}>
      <CompactSlab tone="affirm" slab={affirm} />
      <CompactSlab tone="deny" slab={deny} />
    </div>
  );
}

function CompactSlab({ tone, slab }: { tone: "affirm" | "deny"; slab: Slab }) {
  const Icon = tone === "affirm" ? CheckCircle2 : XCircle;
  return (
    <article className={`card dual-slab-card dual-slab-card--${tone}`}>
      <div className="dual-slab-head">
        <span
          className={`dual-slab-sigil dual-slab-sigil--${tone}`}
          aria-hidden
        >
          {tone === "affirm" ? "+" : "−"}
        </span>
        <div className="dual-slab-titlewrap">
          {slab.kicker ? (
            <span className={`dual-slab-kicker dual-slab-kicker--${tone}`}>
              {slab.kicker}
            </span>
          ) : null}
          <h3 className="dual-slab-title">{slab.title}</h3>
        </div>
        <Icon
          className={`dual-slab-icon dual-slab-icon--${tone}`}
          size={20}
          strokeWidth={1.75}
          aria-hidden
        />
      </div>
      {slab.lede ? <p className="muted dual-slab-lede">{slab.lede}</p> : null}
      <ol className="dual-slab-list">
        {slab.items.map((item, i) => (
          <li key={i} className="dual-slab-row">
            <span
              className={`dual-slab-num dual-slab-num--${tone}`}
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="dual-slab-text">{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

/**
 * Feature variant — used by /about. Emits the existing `.about-split-*` /
 * `.about-dual-*` / `.about-list` className structure so the existing CSS
 * keeps applying. A later refactor renames those to a single dual-slab-*
 * namespace; the component-layer migration ships now.
 */
function FeatureSlab({ tone, slab }: { tone: "affirm" | "deny"; slab: Slab }) {
  const Icon = tone === "affirm" ? CheckCircle2 : XCircle;
  const yesNo = tone === "affirm" ? "yes" : "no";
  return (
    <div className={`about-split-slab about-split-slab--${yesNo}`}>
      {slab.watermark ? (
        <span className="about-split-watermark" aria-hidden>
          {slab.watermark}
        </span>
      ) : null}
      <div className={`card about-dual-card about-dual-${yesNo}`}>
        <div
          className={`about-dual-icon${tone === "deny" ? " about-dual-icon-muted" : ""}`}
          aria-hidden
        >
          <Icon size={24} strokeWidth={2} />
        </div>
        <h3>{slab.title}</h3>
        {slab.lede ? <p className="muted about-dual-lede">{slab.lede}</p> : null}
        <ul className="about-list">
          {slab.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
