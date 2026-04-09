import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";

const staticPaths = [
  "/",
  "/about",
  "/apply",
  "/how-it-works",
  "/nodes",
  "/pob",
  "/login",
  "/signup",
  "/docs"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const base = siteUrl.replace(/\/$/, "");

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8
  }));

  const docs = getAllDocs();
  const docEntries: MetadataRoute.Sitemap = docs.map((doc) => ({
    url: `${base}${doc.href}`,
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));

  return [...staticEntries, ...docEntries];
}
