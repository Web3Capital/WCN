import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";
import { locales, defaultLocale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/site-url";

const MARKETING_PAGES: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1.0, freq: "weekly" },
  { path: "/about", priority: 0.8, freq: "monthly" },
  { path: "/how-it-works", priority: 0.8, freq: "monthly" },
  { path: "/nodes", priority: 0.8, freq: "monthly" },
  { path: "/pob", priority: 0.8, freq: "monthly" },
  { path: "/apply", priority: 0.7, freq: "monthly" },
  { path: "/wiki", priority: 0.9, freq: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, freq } of MARKETING_PAGES) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) {
      alternates[locale] = `${base}/${locale}${path === "/" ? "" : path}`;
    }

    entries.push({
      url: `${base}/${defaultLocale}${path === "/" ? "" : path}`,
      lastModified: now,
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
      url: `${base}/${defaultLocale}${doc.href}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: alternates },
    });
  }

  return entries;
}
