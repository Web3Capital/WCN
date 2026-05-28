import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";
import { locales, defaultLocale } from "@/i18n/config";

// Phase 4 / ADR-MR-005: canonical URLs are bare paths (e.g. /about) — the
// default locale is NOT prepended. Google decides the right localized variant
// from the <alternates.languages> map. The previous shape of
// `/${defaultLocale}/about` lost ranking weight from the bare root domain.

const MARKETING_PAGES: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1.0, freq: "weekly" },
  { path: "/about", priority: 0.8, freq: "monthly" },
  { path: "/how-it-works", priority: 0.8, freq: "monthly" },
  { path: "/nodes", priority: 0.8, freq: "monthly" },
  { path: "/pob", priority: 0.8, freq: "monthly" },
  { path: "/apply", priority: 0.7, freq: "monthly" },
  { path: "/wiki", priority: 0.9, freq: "weekly" },
];

const CONTENT_BASE = path.join(process.cwd(), "content", "wiki");

/**
 * Filesystem mtime of the canonical wiki file for a (chapterSlug, order) doc.
 * Falls back to "now" if the file is not on disk (defensive — should not happen).
 */
function getDocMtime(locale: string, filePath: string): string {
  try {
    const abs = path.join(CONTENT_BASE, locale, filePath);
    return fs.statSync(abs).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Filesystem mtime of a marketing page.tsx — proxies "when did this page last
 * change". The previous `new Date()` made every crawl look like a content
 * update and trained Google to ignore lastModified entirely.
 */
function getMarketingPageMtime(pagePath: string): string {
  const file =
    pagePath === "/"
      ? "app/[locale]/page.tsx"
      : `app/[locale]${pagePath}/page.tsx`;
  try {
    return fs.statSync(path.join(process.cwd(), file)).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const base = siteUrl.replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = [];

  for (const { path: pagePath, priority, freq } of MARKETING_PAGES) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) {
      alternates[locale] = `${base}/${locale}${pagePath === "/" ? "" : pagePath}`;
    }

    entries.push({
      // Bare path. Google reads <alternates> and serves the right locale.
      url: `${base}${pagePath === "/" ? "" : pagePath}` || base,
      lastModified: getMarketingPageMtime(pagePath),
      changeFrequency: freq,
      priority,
      alternates: { languages: alternates },
    });
  }

  // Wiki docs: every (chapter, section) tuple has one canonical entry whose
  // <alternates.languages> map points to the equivalent doc in every locale.
  // Slugs match exactly across the 9 ASCII-slug locales (en/ja/ko/es/fr/de/
  // pt/ar/ru), but zh keeps Chinese filenames — so we look up each locale's
  // doc by (chapterSlug, meta.order) rather than copying the path.
  const localeDocs: Record<string, ReturnType<typeof getAllDocs>> = {};
  for (const loc of locales) localeDocs[loc] = getAllDocs(loc);

  for (const doc of localeDocs[defaultLocale]) {
    const alternates: Record<string, string> = {};
    for (const loc of locales) {
      const equiv = localeDocs[loc].find(
        (d) => d.chapterSlug === doc.chapterSlug && d.meta.order === doc.meta.order,
      );
      const href = equiv?.href ?? doc.href;
      alternates[loc] = `${base}/${loc}${href}`;
    }
    entries.push({
      // Canonical URL has no locale prefix — see comment at top of file.
      url: `${base}${doc.href}`,
      lastModified: getDocMtime(defaultLocale, doc.filePath),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: alternates },
    });
  }

  return entries;
}
