/**
 * Content Security Policy helpers.
 *
 * Phase 4 of the marketing redesign (see docs/marketing-redesign.md).
 *
 * Two policies are emitted simultaneously while we observe nonce safety:
 *
 *   - The enforcing policy in next.config.mjs (still allows 'unsafe-inline'
 *     so the site keeps working today).
 *   - A strict nonce-based policy emitted via `Content-Security-Policy-
 *     Report-Only` from proxy.ts. The browser will not block on this header,
 *     but it will POST violations to `report-uri` (when configured).
 *
 * Once Report-Only shows zero violations in production for a week, the
 * enforcing policy is swapped to this strict variant and the Report-Only
 * header is removed.
 */

const DEV = process.env.NODE_ENV === "development";

/**
 * Build a strict, nonce-based CSP directive string suitable for use as the
 * value of `Content-Security-Policy` or `Content-Security-Policy-Report-Only`.
 *
 * The `'strict-dynamic'` keyword lets a script loaded via the nonce trust its
 * own dynamic children — sidestepping the need to enumerate every analytics
 * subdomain. Modern browsers (CSP3) honor it; older browsers fall back to the
 * explicit allowlist below.
 */
export function buildStrictCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${DEV ? "'unsafe-eval'" : ""} https: 'unsafe-inline'`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.vercel.app https://*.githubusercontent.com https://*.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.vercel.app https://*.upstash.io https://api.twilio.com https://*.sentry.io https://vitals.vercel-insights.com wss://*.vercel.app",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
    process.env.CSP_REPORT_URI ? `report-uri ${process.env.CSP_REPORT_URI}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Generate a fresh CSP nonce per request. Edge-runtime safe (uses Web
 * Crypto). 128 bits of entropy in URL-safe base64.
 */
export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  // btoa is available in Edge runtime and modern Node.
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
