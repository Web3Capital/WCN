import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "WCN — Global Institutional Orchestrator",
  description: "WCN official site starter built with Next.js."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = cookies().get("wcn_lang")?.value === "zh" ? "zh" : "en";
  const theme = cookies().get("wcn_theme")?.value;
  const dataTheme = theme === "light" || theme === "dark" ? theme : "system";
  return (
    <html lang={lang} data-theme={dataTheme}>
      <body>
        <Providers>
          <a href="#main-content" className="visually-hidden" style={{ position: "absolute", top: 8, left: 8, zIndex: 999, padding: "8px 12px", background: "var(--accent)", color: "#fff", borderRadius: 8 }}>Skip to content</a>
          <Nav />
          <div id="main-content">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
