import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://vercel.live https://*.vercel-scripts.com`.trim(),
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.vercel.app https://*.githubusercontent.com https://*.googleusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.vercel.app https://*.upstash.io https://api.twilio.com https://*.sentry.io wss://*.vercel.app",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
              process.env.CSP_REPORT_URI ? `report-uri ${process.env.CSP_REPORT_URI}` : "",
            ].filter(Boolean).join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/wiki",
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: "/wiki/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
