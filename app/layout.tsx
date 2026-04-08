import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { cookies } from "next/headers";

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
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
