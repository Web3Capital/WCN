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
export const alt = "How it works — Web3 Capital Network";

export default async function OgImage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const tHiw = await getTranslations({ locale, namespace: "howItWorks" });

  return renderOgImage({
    eyebrow: tHiw("eyebrow"),
    title: stripEm(tHiw("headline")),
    description: tHiw("metaDesc"),
  });
}

function stripEm(s: string): string {
  return s.replace(/<\/?em>/g, "").replace(/<\/?strong>/g, "");
}
