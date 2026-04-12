import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";
import { locales, defaultLocale } from "@/i18n/config";

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
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const base = siteUrl.replace(/\/$/, "");
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

  const docs = getAllDocs();
  for (const doc of docs) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) {
      alternates[locale] = `${base}/${locale}${doc.href}`;
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
