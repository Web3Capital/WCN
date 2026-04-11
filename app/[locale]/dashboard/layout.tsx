import type { Metadata } from "next";
import { redirect } from "@/i18n/routing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { DashboardShell } from "./_components/dashboard-shell";
import { Spotlight } from "./_components/spotlight";
import { AutoTranslateProvider } from "@/lib/i18n/auto-translate-provider";

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

  const u = session.user;
  return (
    <DashboardShell
      displayName={u.name ?? u.email ?? "Account"}
      email={u.email ?? undefined}
      role={u.role!}
      isAdmin={isAdminRole(u.role!)}
    >
      <AutoTranslateProvider locale={locale ?? "en"}>
        {children}
      </AutoTranslateProvider>
      <Spotlight />
    </DashboardShell>
  );
}
