import { Inter, EB_Garamond, JetBrains_Mono } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  fallback: [
    "ui-sans-serif",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "PingFang SC",
    "Hiragino Sans",
    "Noto Sans CJK SC",
    "Noto Sans Arabic",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

// v4.0 Sovereign Proof Ledger — display serif is EB Garamond (EN) backed by
// Source Han Serif SC for CJK. Italic is loaded for EN-only editorial emphasis
// (CN never renders italic; see the :lang() rules in globals.css).
export const fontSerif = EB_Garamond({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
  fallback: [
    "Source Han Serif SC",
    "Songti SC",
    "Georgia",
    "Times New Roman",
    "serif",
  ],
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});
