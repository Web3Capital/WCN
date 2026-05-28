/**
 * EditorialMasthead — magazine-style page opening for /about.
 *
 * Where the home hero is a sales pitch, this is a feature-article
 * opening. Issue mark + date band, then a massive Fraunces title with
 * italic emphasis, byline kicker, and a quiet rule below. Generous
 * negative space — the page must breathe before any density.
 *
 * Phase 3 follow-up (Task 21): the masthead bar itself is no longer
 * implemented inline here — it delegates to <PageMasthead/>, the single
 * source of truth for the "№ XX · SECTION · VOLUME · MMXXVI" bar. The
 * article-opening chrome around the bar (kicker / title / lede / dropcap /
 * rule-end) stays here because it's unique to the editorial variant.
 *
 * Server component; renders nothing dynamic.
 */

import type { ReactNode } from "react";
import { PageMasthead } from "@/components/marketing/page-masthead";

type Props = {
  issueNumber: string;
  /** Section label rendered between the two rules in the masthead bar. */
  section: string;
  /** Volume / issue date — typically `t("common.editorial.volumeIssue")`. */
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
        <PageMasthead
          issueNumber={issueNumber}
          section={section}
          volumeIssue={issueDate}
        />
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
