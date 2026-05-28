import { getTranslations } from "next-intl/server";
import {
  ogContentType,
  ogSize,
  renderOgImage,
} from "@/lib/og-image-template";

export const runtime = "edge";
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
