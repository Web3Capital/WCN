import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import { locales, localeMetadata, type Locale } from "@/i18n/config";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US", zh: "zh_CN", ja: "ja_JP", ko: "ko_KR",
  es: "es_ES", fr: "fr_FR", de: "de_DE", pt: "pt_BR",
  ar: "ar_SA", ru: "ru_RU",
};

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  const base = siteUrl.replace(/\/$/, "");

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${base}/${loc}`;
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    alternates: {
      canonical: `${base}/${locale}`,
      languages,
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE_MAP[locale] ?? locale,
      siteName: "WCN",
      title: t("title"),
      description: t("ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("twitterDescription"),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const meta = localeMetadata[locale as Locale];
  const theme = cookies().get("wcn_theme")?.value;
  const dataTheme = theme === "light" || theme === "dark" ? theme : "system";

  return (
    <html lang={locale} dir={meta?.dir ?? "ltr"} data-theme={dataTheme}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <a href="#main-content" className="skip-link">
              {messages && (messages as any).common?.skipToContent || "Skip to content"}
            </a>
            <Nav />
            <div id="main-content">{children}</div>
            <Footer />
            <SpeedInsights />
            <Analytics />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
