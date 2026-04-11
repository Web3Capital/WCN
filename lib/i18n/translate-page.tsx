import { autoTranslate } from "./auto-translate";
import { AutoTranslateProvider } from "./auto-translate-provider";

/**
 * Server component wrapper that auto-translates strings for a dashboard page.
 *
 * Usage in a server page:
 *   import { TranslatedPage } from "@/lib/i18n/translate-page";
 *
 *   export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
 *     const { locale } = await params;
 *     return (
 *       <TranslatedPage locale={locale} strings={["Matches", "Score", "Status"]}>
 *         <MyClientComponent />
 *       </TranslatedPage>
 *     );
 *   }
 */
export async function TranslatedPage({
  locale,
  strings,
  children,
}: {
  locale: string;
  strings: string[];
  children: React.ReactNode;
}) {
  const translations = await autoTranslate(strings, locale);
  return (
    <AutoTranslateProvider locale={locale} initial={translations}>
      {children}
    </AutoTranslateProvider>
  );
}
