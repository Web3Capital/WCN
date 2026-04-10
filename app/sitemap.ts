import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";
import { locales, defaultLocale } from "@/i18n/config";

const staticPaths = [
  "/",
  "/about",
  "/apply",
  "/how-it-works",
  "/nodes",
  "/pob",
  "/login",
  "/signup",
  "/wiki",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const base = siteUrl.replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    const alternates: Record<string, string> = {};
    for (const locale of locales) {
      alternates[locale] = `${base}/${locale}${path === "/" ? "" : path}`;
    }

    entries.push({
      url: `${base}/${defaultLocale}${path === "/" ? "" : path}`,
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.8,
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
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: alternates },
    });
  }

  return entries;
}
