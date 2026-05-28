/**
 * VoltageCallout — pre-footer call-to-action band.
 *
 * The voltage signature payoff. A full-bleed band with the WCN glyph
 * on a dark ink field, three-color radial atmosphere, and a confident
 * editorial headline + dual CTA.
 *
 * Server component — no interactivity beyond Link navigation.
 */

import { Link } from "@/i18n/routing";
import { WCNGlyph } from "./wcn-glyph";

// Phase 5: callout supports the full marketing funnel surface, including /pob.
// Each marketing page picks its own "next step" pair rather than every page
// pointing at /apply — see docs/marketing-redesign.md Phase 5.
type MarketingHref = "/apply" | "/wiki" | "/nodes" | "/how-it-works" | "/about" | "/pob";

type Props = {
  eyebrow: string;
  title: string;
  desc: string;
  primaryLabel: string;
  primaryHref: MarketingHref;
  secondaryLabel: string;
  secondaryHref: MarketingHref;
};

export function VoltageCallout({
  eyebrow,
  title,
  desc,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: Props) {
  return (
    <section className="voltage-callout">
      <div className="container">
        <div className="voltage-callout-inner">
          <span className="voltage-callout-glyph" aria-hidden>
            <WCNGlyph size={28} variant="ledger" />
          </span>
          <span className="eyebrow eyebrow-plain voltage-callout-eyebrow">{eyebrow}</span>
          <h2 className="voltage-callout-title">{title}</h2>
          <p className="voltage-callout-desc">{desc}</p>
          <div className="cta-row cta-centered voltage-callout-actions">
            <Link href={primaryHref} className="button button-lg">
              {primaryLabel}
            </Link>
            <Link href={secondaryHref} className="button-secondary button-lg voltage-callout-secondary">
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
