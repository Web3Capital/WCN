import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { locales, localeMetadata, type Locale } from "@/i18n/config";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { fontSans, fontSerif, fontMono } from "@/app/fonts";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US", zh: "zh_CN", ja: "ja_JP", ko: "ko_KR",
  es: "es_ES", fr: "fr_FR", de: "de_DE", pt: "pt_BR",
  ar: "ar_SA", ru: "ru_RU",
};

function stripLocalePrefix(pathname: string, locale: string): string {
  const re = new RegExp(`^/${locale}(/|$)`);
  return pathname.replace(re, "/").replace(/\/$/, "") || "/";
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  const base = siteUrl.replace(/\/$/, "");

  const h = await headers();
  const fullUrl = h.get("x-url") || h.get("x-invoke-path") || "";
  const rawPathname = fullUrl ? new URL(fullUrl, siteUrl).pathname : `/${locale}`;
  const pathWithoutLocale = stripLocalePrefix(rawPathname, locale);
  const suffix = pathWithoutLocale === "/" ? "" : pathWithoutLocale;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${base}/${loc}${suffix}`;
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: t.raw("titleTemplate"),
    },
    description: t("description"),
    alternates: {
      canonical: `${base}/${locale}${suffix}`,
      languages,
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE_MAP[locale] ?? locale,
      siteName: "Web3 Capital Network",
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
  const cookieStore = await cookies();
  const theme = cookieStore.get("wcn_theme")?.value;
  const dataTheme = theme === "light" || theme === "dark" ? theme : "system";

  const base = siteUrl.replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "Web3 Capital Network",
        url: base,
        logo: { "@type": "ImageObject", url: `${base}/icon.png` },
        description: "The business network for Web3 and AI — connecting capital, projects, and services with verified proof and fair settlement.",
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "Web3 Capital Network",
        url: base,
        publisher: { "@id": `${base}/#organization` },
        inLanguage: locales,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${base}/en/wiki?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang={locale}
      dir={meta?.dir ?? "ltr"}
      data-theme={dataTheme}
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
