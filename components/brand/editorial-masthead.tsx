/**
 * EditorialMasthead — magazine-style page opening for /about.
 *
 * Where the home hero is a sales pitch, this is a feature-article
 * opening. Issue mark + date band, then a massive Fraunces title with
 * italic emphasis, byline kicker, and a quiet rule below. Generous
 * negative space — the page must breathe before any density.
 *
 * Server component; renders nothing dynamic. Each line is tagged as a
 * reveal target so the masthead "unfolds" line-by-line on mount via the
 * global ScrollReveal observer.
 */

import type { ReactNode } from "react";

type Props = {
  issueNumber: string;
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

export function EditorialMasthead({ issueNumber, issueDate, kicker, title, lede, ledeDropcap }: Props) {
  return (
    <header className="editorial-masthead" data-anim-host>
      <div className="container" data-reveal-group>
        <div className="editorial-masthead-bar" data-reveal="fade">
          <span className="editorial-masthead-issue">{issueNumber}</span>
          <span className="editorial-masthead-rule" aria-hidden />
          <span className="editorial-masthead-date">{issueDate}</span>
        </div>
        <p className="editorial-masthead-kicker" data-reveal>{kicker}</p>
        <h1 className="editorial-masthead-title" data-reveal>{title}</h1>
        {lede ? (
          <p
            className={`editorial-masthead-lede${ledeDropcap ? " editorial-masthead-lede-dropcap" : ""}`}
            data-reveal
          >
            {lede}
          </p>
        ) : null}
        <span className="editorial-masthead-rule-end" aria-hidden />
      </div>
    </header>
  );
}
