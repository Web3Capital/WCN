/**
 * PageMasthead — the editorial issue bar that opens every marketing page.
 *
 * Phase 3 of the marketing redesign (see docs/marketing-redesign.md).
 *
 * Before this component, the same visual artifact was reimplemented six times
 * with six different className prefixes (.wcn-masthead-* / .editorial-masthead-* /
 * .hiw-issue-* / .nodes-masthead-* / .pob-masthead-* / .apply-masthead-*).
 * Changing the rule color or letter-spacing required editing six places.
 *
 * This component is the single source of truth. It outputs the canonical
 * `.wcn-masthead` class structure; the other five prefixes are deleted in
 * Task 18 (Phase 3 — CSS瘦身).
 *
 * Server component — purely declarative.
 */

type Props = {
  /**
   * Issue number in the masthead bar, e.g. "№ 01". Optional — pages that
   * sit outside the editorial volume (currently /apply, per ADR-MR-003)
   * omit this and render the section label as a standalone marker.
   */
  issueNumber?: string;
  /** Section label rendered between the two rules, e.g. "Prologue", "About". */
  section: string;
  /**
   * Volume / issue date — always pass `t("common.editorial.volumeIssue")`.
   * ADR-MR-004: the literal string "Volume · MMXXVI" is preserved across all
   * 10 locales for brand consistency.
   */
  volumeIssue: string;
};

export function PageMasthead({ issueNumber, section, volumeIssue }: Props) {
  return (
    <div className="wcn-masthead" aria-hidden>
      {issueNumber ? (
        <>
          <span className="wcn-masthead-mark">{issueNumber}</span>
          <span className="wcn-masthead-rule" />
        </>
      ) : null}
      <span className="wcn-masthead-section">{section}</span>
      <span className="wcn-masthead-rule" />
      <span className="wcn-masthead-meta">{volumeIssue}</span>
    </div>
  );
}
