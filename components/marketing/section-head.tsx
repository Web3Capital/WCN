/**
 * SectionHead — the "№ XX · Eyebrow · Title · Lede" stack that opens every
 * numbered section on a marketing page.
 *
 * Phase 3 of the marketing redesign (see docs/marketing-redesign.md).
 *
 * Replaces 25+ inline `<div className="section-head section-head-numbered">…`
 * blocks across the five marketing pages with a single typed component.
 *
 * Server component.
 */

import type { ReactNode } from "react";

type Props = {
  /** Numeric tag like "№ 01", "№ 02·a". Renders before the eyebrow. */
  number?: string;
  /** Uppercase tag above the title. */
  eyebrow: string;
  /** Heading text. May contain rich content (e.g. `<em>`). */
  title: ReactNode;
  /** Optional supporting paragraph below the title. */
  lede?: ReactNode;
  /**
   * Optional extra className for the wrapping `<div class="section-head ...">`.
   * Use to nudge alignment on a single page without forking the component.
   */
  className?: string;
  /**
   * Extra className appended to the `<h2>` — used for page-specific overrides
   * like `.pob-section-h2`, `.nodes-section-h2`. Will be deleted in a later
   * pass once the per-page deltas are normalized into shared design tokens.
   */
  titleClassName?: string;
  /** Extra className appended to the lede `<p>`. */
  ledeClassName?: string;
};

export function SectionHead({
  number,
  eyebrow,
  title,
  lede,
  className,
  titleClassName,
  ledeClassName,
}: Props) {
  return (
    <div
      className={`section-head section-head-numbered${className ? ` ${className}` : ""}`}
    >
      {number ? <span className="section-number">{number}</span> : null}
      <span className="eyebrow">{eyebrow}</span>
      <h2 className={`u-mt-3${titleClassName ? ` ${titleClassName}` : ""}`}>{title}</h2>
      {lede ? (
        <p className={`muted hero-lede${ledeClassName ? ` ${ledeClassName}` : ""}`}>
          {lede}
        </p>
      ) : null}
    </div>
  );
}
