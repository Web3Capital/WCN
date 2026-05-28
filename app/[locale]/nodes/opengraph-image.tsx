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
export const alt = "Node network — Web3 Capital Network";

export default async function OgImage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const tNodes = await getTranslations({ locale, namespace: "nodes" });

  return renderOgImage({
    eyebrow: tNodes("eyebrow"),
    title: stripEm(tNodes("headline")),
    description: tNodes("metaDesc"),
  });
}

function stripEm(s: string): string {
  return s.replace(/<\/?em>/g, "").replace(/<\/?strong>/g, "");
}
