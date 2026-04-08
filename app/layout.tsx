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
  return (
    <html lang={lang}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
