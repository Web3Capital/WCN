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

type Props = {
  eyebrow: string;
  title: string;
  desc: string;
  primaryLabel: string;
  primaryHref: "/apply" | "/wiki" | "/nodes" | "/how-it-works" | "/about";
  secondaryLabel: string;
  secondaryHref: "/apply" | "/wiki" | "/nodes" | "/how-it-works" | "/about";
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
