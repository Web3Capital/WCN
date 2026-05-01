/**
 * GenesisPullQuote — archival document quote.
 *
 * Renders a large editorial pull quote attributed to a founding document
 * (e.g., "WCN v3.0 white paper"), with a reference number formatted in
 * mono — like a real archived document citation. Sets the tone of
 * "this is a serious institutional protocol", not a marketing site.
 *
 * Server component.
 */

import { WCNGlyph } from "./wcn-glyph";

type Props = {
  eyebrow: string;
  quote: string;
  attribution: string;
  /** A reference string. May contain HTML entities (e.g. `&#8470;` for №) */
  ref: string;
};

export function GenesisPullQuote({ eyebrow, quote, attribution, ref }: Props) {
  return (
    <section className="section section-genesis" data-anim-host>
      <div className="container">
        <figure className="genesis-pull-quote">
          <span className="genesis-mark" aria-hidden>
            <WCNGlyph size={24} variant="ledger" />
          </span>
          <span className="genesis-eyebrow">{eyebrow}</span>
          <blockquote className="genesis-quote">
            <span className="genesis-open-quote" aria-hidden>&ldquo;</span>
            {quote}
            <span className="genesis-close-quote" aria-hidden>&rdquo;</span>
          </blockquote>
          <figcaption className="genesis-figcaption">
            <span className="genesis-attribution">{attribution}</span>
            <span className="genesis-ref" dangerouslySetInnerHTML={{ __html: ref }} />
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
