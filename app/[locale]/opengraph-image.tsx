import { getTranslations } from "next-intl/server";
import {
  ogContentType,
  ogSize,
  renderOgImage,
} from "@/lib/og-image-template";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Web3 Capital Network — The Business Network for Web3 and AI";

export default async function OgImage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const tHome = await getTranslations({ locale, namespace: "home" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  return renderOgImage({
    eyebrow: tHome("mastheadSection"),
    title: stripEm(tHome("headline")),
    description: tMeta("ogDescription"),
  });
}

/** Marketing copy uses inline <em>…</em> for accentuated words. The OG image
 *  is text-only, so flatten the tags. */
function stripEm(s: string): string {
  return s.replace(/<\/?em>/g, "");
}
