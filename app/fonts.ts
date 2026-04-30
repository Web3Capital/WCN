import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";

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

export const fontSerif = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
  axes: ["SOFT", "opsz"],
  fallback: [
    "Tiempos Headline",
    "Iowan Old Style",
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
