import { getAllDocs } from "@/lib/docs";

/**
 * Build a wiki href for a stable (chapterSlug, sectionNumber) pair across
 * locales. Slugs differ per locale — zh keeps Chinese filenames while
 * en/ja/ko/es/fr/de/pt/ar/ru use ASCII slugs — so any cross-locale link into
 * the wiki must be looked up via the locale-stable (chapterSlug, meta.order)
 * tuple rather than a hard-coded path.
 *
 * Falls back to the chapter root if the (chapter, section) pair is not found
 * in the requested locale.
 *
 * Use this anywhere a marketing page links into the wiki — never hard-code a
 * locale-specific slug. See ADR-MR-005 and Phase 1 in
 * docs/marketing-redesign.md.
 *
 * Example:
 *   getWikiHref("zh", "project-intro", 1) → "/wiki/project-intro/1-1-wcn-是什么"
 *   getWikiHref("en", "project-intro", 1) → "/wiki/project-intro/1-1-what-is-wcn"
 */
export function getWikiHref(
  locale: string,
  chapterSlug: string,
  sectionNumber: number,
): string {
  const docs = getAllDocs(locale);
  const match = docs.find(
    (d) => d.chapterSlug === chapterSlug && d.meta.order === sectionNumber,
  );
  if (match) return match.href;
  // Fallback to chapter root when this locale doesn't have the exact section.
  return `/wiki/${chapterSlug}`;
}
