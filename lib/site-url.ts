/**
 * Single source for the canonical site origin.
 *
 * Resolves from env with a defensive `.trim()` — a trailing newline in
 * NEXT_PUBLIC_SITE_URL / NEXTAUTH_URL (a classic copy-paste-into-Vercel-env
 * mistake) used to leak into robots.txt and sitemap.xml as a line break inside
 * every URL, breaking them for every crawler. Trim + strip trailing slashes so
 * the value is always a clean origin like "https://wcn.network".
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return raw.trim().replace(/\/+$/, "");
}
