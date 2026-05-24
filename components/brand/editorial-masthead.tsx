/**
 * EditorialMasthead — magazine-style page opening for /about.
 *
 * Where the home hero is a sales pitch, this is a feature-article
 * opening. Issue mark + date band, then a massive Fraunces title with
 * italic emphasis, byline kicker, and a quiet rule below. Generous
 * negative space — the page must breathe before any density.
 *
 * Server component; renders nothing dynamic.
 */

import type { ReactNode } from "react";

type Props = {
  issueNumber: string;
  /** Section label rendered between the two rules in the masthead bar. Aligns
   *  with the canonical /nodes pattern: `№ XX · SECTION · VOLUME · MMXXVI`. */
  section: string;
  issueDate: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  /**
   * If true, the first letter of the lede paragraph renders as a magazine
   * drop-letter (Fraunces italic, ~4em). Editorial convention: dropcap
   * belongs on the article opening, not on later sub-paragraphs.
   */
  ledeDropcap?: boolean;
};

export function EditorialMasthead({ issueNumber, section, issueDate, kicker, title, lede, ledeDropcap }: Props) {
  return (
    <header className="editorial-masthead" data-anim-host>
      <div className="container">
        <div className="wcn-masthead editorial-masthead-bar" aria-hidden>
          <span className="wcn-masthead-mark editorial-masthead-issue">{issueNumber}</span>
          <span className="wcn-masthead-rule editorial-masthead-rule" />
          <span className="wcn-masthead-section editorial-masthead-date">{section}</span>
          <span className="wcn-masthead-rule editorial-masthead-rule" />
          <span className="wcn-masthead-meta editorial-masthead-date">{issueDate}</span>
        </div>
        <p className="editorial-masthead-kicker">{kicker}</p>
        <h1 className="editorial-masthead-title">{title}</h1>
        {lede ? (
          <p className={`editorial-masthead-lede${ledeDropcap ? " editorial-masthead-lede-dropcap" : ""}`}>
            {lede}
          </p>
        ) : null}
        <span className="editorial-masthead-rule-end" aria-hidden />
      </div>
    </header>
  );
}
