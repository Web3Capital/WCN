import { getTranslations } from "next-intl/server";
import {
  ogContentType,
  ogSize,
  renderOgImage,
} from "@/lib/og-image-template";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Proof of Business — Web3 Capital Network";

export default async function OgImage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const tPob = await getTranslations({ locale, namespace: "pob" });

  return renderOgImage({
    eyebrow: tPob("eyebrow"),
    title: stripEm(tPob("headline")),
    description: tPob("metaDesc"),
  });
}

function stripEm(s: string): string {
  return s.replace(/<\/?em>/g, "").replace(/<\/?strong>/g, "");
}
