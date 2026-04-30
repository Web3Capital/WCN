/**
 * ManifestoBlock — editorial pull-quote section.
 *
 * The emotional anchor of the home page. A short paragraph (≤3 sentences)
 * set in Fraunces optical-sized for display, with one large emphasized
 * lead word. Inspired by Stripe Press / The Atlantic feature openings.
 *
 * Lead word uses --text (not voltage) so it doesn't compete with CTA color.
 */

import { WCNGlyph } from "./wcn-glyph";

type Props = {
  eyebrow: string;
  lead: string;
  body: string;
  signature: string;
  sectionNumber?: string;
};

export function ManifestoBlock({ eyebrow, lead, body, signature, sectionNumber }: Props) {
  return (
    <section className="section section-manifesto">
      <div className="container">
        <div className="manifesto">
          <div className="manifesto-mark" aria-hidden>
            <WCNGlyph size={20} variant="ledger" />
          </div>
          {sectionNumber ? <span className="section-number manifesto-section-number">{sectionNumber}</span> : null}
          <span className="eyebrow eyebrow-plain manifesto-eyebrow">{eyebrow}</span>
          <p className="manifesto-prose">
            <span className="manifesto-lead">{lead}</span>
            <span className="manifesto-body"> {body}</span>
          </p>
          <p className="manifesto-signature">{signature}</p>
        </div>
      </div>
    </section>
  );
}
