import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { locales, localeMetadata, type Locale } from "@/i18n/config";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { ThemeScript } from "@/components/theme-script";
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

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

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

export default async function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const meta = localeMetadata[locale as Locale];

  // ThemeScript (rendered in <head>) sets data-theme synchronously from the
  // wcn_theme cookie on the client before first paint. The SSR default below
  // is "system" so the page is statically renderable — see ADR-MR-002 in
  // docs/marketing-redesign.md.
  //
  // Phase 4: read the per-request CSP nonce set by proxy.ts. Inline scripts
  // emit `nonce={nonce}` so the Report-Only strict CSP passes; missing-nonce
  // on a static asset path is tolerable (proxy.ts only runs on page routes).
  const reqHeaders = await headers();
  const nonce = reqHeaders.get("x-nonce") ?? undefined;

  // Phase 4: JSON-LD description goes through the metadata namespace so each
  // locale's search snippet is in the local language. `inLanguage` becomes a
  // single value (the current locale) — schema.org expects a string here, not
  // a list of all supported languages.
  const tMeta = await getTranslations({ locale, namespace: "metadata" });
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
        description: tMeta("ogDescription"),
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "Web3 Capital Network",
        url: base,
        publisher: { "@id": `${base}/#organization` },
        inLanguage: locale,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${base}/${locale}/wiki?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang={locale}
      dir={meta?.dir ?? "ltr"}
      data-theme="system"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <head>
        <ThemeScript nonce={nonce} />
        <script
          type="application/ld+json"
          nonce={nonce}
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
