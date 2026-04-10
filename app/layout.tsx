import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WCN — Global Institutional Orchestrator",
    template: "%s — WCN"
  },
  description:
    "WCN turns fragmented capital, resources, and execution into a structured, verifiable, settleable global network for Web3 and AI.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "WCN",
    title: "WCN — Global Institutional Orchestrator",
    description:
      "Coordination layer for the decentralized economy: nodes, deals, proof, and settlement."
  },
  twitter: {
    card: "summary_large_image",
    title: "WCN — Global Institutional Orchestrator",
    description:
      "Structured coordination for institutional Web3 and AI — verifiable work, aligned settlement."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = cookies().get("wcn_lang")?.value === "zh" ? "zh" : "en";
  const theme = cookies().get("wcn_theme")?.value;
  const dataTheme = theme === "light" || theme === "dark" ? theme : "system";
  return (
    <html lang={lang} data-theme={dataTheme}>
      <body>
        <Providers>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <Nav />
          <div id="main-content">
            {children}
          </div>
          <Footer />
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
