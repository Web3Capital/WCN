import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { DashboardShell } from "./_components/dashboard-shell";
import { Spotlight } from "./_components/spotlight";

export const metadata: Metadata = {
  title: "Console · WCN",
  description: "WCN collaboration network console."
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const u = session.user;
  return (
    <DashboardShell
      displayName={u.name || u.email || "Account"}
      email={u.email ?? undefined}
      role={u.role}
      isAdmin={isAdminRole(u.role)}
    >
      {children}
      <Spotlight />
    </DashboardShell>
  );
}
