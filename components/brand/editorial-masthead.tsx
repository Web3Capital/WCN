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
  issueDate: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
};

export function EditorialMasthead({ issueNumber, issueDate, kicker, title, lede }: Props) {
  return (
    <header className="editorial-masthead" data-anim-host>
      <div className="container">
        <div className="editorial-masthead-bar">
          <span className="editorial-masthead-issue">{issueNumber}</span>
          <span className="editorial-masthead-rule" aria-hidden />
          <span className="editorial-masthead-date">{issueDate}</span>
        </div>
        <p className="editorial-masthead-kicker">{kicker}</p>
        <h1 className="editorial-masthead-title">{title}</h1>
        {lede ? <p className="editorial-masthead-lede">{lede}</p> : null}
        <span className="editorial-masthead-rule-end" aria-hidden />
      </div>
    </header>
  );
}
