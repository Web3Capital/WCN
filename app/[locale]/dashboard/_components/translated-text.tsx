"use client";

import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

/**
 * Runtime translation wrapper that looks up the English literal in the
 * dashboard auto-translate cache (server-preloaded via the dashboard
 * layout) and falls back to fetching `/api/translate` on the client.
 *
 * @deprecated New code should use `useTranslations` (client) or
 * `getTranslations` (server) from `next-intl` with proper i18n keys in
 * `messages/{locale}.json`. The `<T>` pattern uses English strings as
 * lookup keys, which means:
 *   - typos / casing changes silently break translations
 *   - no IDE autocomplete or type safety
 *   - new strings rely on Google Translate quality until curated
 *   - dynamic / interpolated text can't use it
 *
 * Existing usages still work because the dashboard layout pre-loads the
 * cache server-side (see lib/i18n/auto-translate-provider.tsx and
 * lib/i18n/auto-translate.ts). Migrate file-by-file when touching code:
 *
 *   // before
 *   import { T } from "@/app/[locale]/dashboard/_components/translated-text";
 *   <h1><T>Settings</T></h1>
 *
 *   // after — server component
 *   import { getTranslations } from "next-intl/server";
 *   const t = await getTranslations("dashboard.settingsPage");
 *   <h1>{t("title")}</h1>
 *
 *   // after — client component
 *   import { useTranslations } from "next-intl";
 *   const t = useTranslations("dashboard.settingsPage");
 *   <h1>{t("title")}</h1>
 *
 * See app/[locale]/dashboard/users/page.tsx and settings/page.tsx for
 * canonical migration examples.
 */
export function T({ children }: { children: string }) {
  const { t } = useAutoTranslate();
  return <>{t(children)}</>;
}
