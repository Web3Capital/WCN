import type { Metadata } from "next";
import { redirect } from "@/i18n/routing";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { DashboardShell } from "./_components/dashboard-shell";
import { Spotlight } from "./_components/spotlight";
import { AutoTranslateProvider } from "@/lib/i18n/auto-translate-provider";
import { loadCachedTranslations } from "@/lib/i18n/auto-translate";

export const metadata: Metadata = {
  title: "Console · WCN",
  description: "WCN collaboration network console."
};

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations("dashboard.overview");
  const activeLocale = locale ?? "en";
  // Load auto-translate cache server-side so cached strings render correctly
  // on first paint instead of flashing English while the client hydrates.
  const initialTranslations = loadCachedTranslations(activeLocale);
  const u = session.user;
  return (
    <DashboardShell
      displayName={u.name ?? u.email ?? t("fallbackName")}
      email={u.email ?? undefined}
      role={u.role!}
      isAdmin={isAdminRole(u.role!)}
    >
      <AutoTranslateProvider locale={activeLocale} initial={initialTranslations}>
        {children}
      </AutoTranslateProvider>
      <Spotlight />
    </DashboardShell>
  );
}
