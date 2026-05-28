import { getTranslations } from "next-intl/server";
import {
  ogContentType,
  ogSize,
  renderOgImage,
} from "@/lib/og-image-template";

// See /[locale]/opengraph-image.tsx for the Edge → Node.js runtime rationale.
export const runtime = "nodejs";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "About — Web3 Capital Network";

export default async function OgImage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const tAbout = await getTranslations({ locale, namespace: "about" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return renderOgImage({
    eyebrow: tNav("about"),
    title: stripEm(tAbout("headline")),
    description: tAbout("metaDesc"),
  });
}

function stripEm(s: string): string {
  return s.replace(/<\/?em>/g, "").replace(/<\/?strong>/g, "");
}
