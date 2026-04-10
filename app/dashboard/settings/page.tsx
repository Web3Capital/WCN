import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { SettingsPage } from "./ui";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, passwordHash: true },
  });

  return (
    <div className="dashboard-page section">
      <div className="container" style={{ maxWidth: 720 }}>
        <span className="eyebrow">Account</span>
        <h1>Settings</h1>
        <p className="muted">Security, sessions, and preferences.</p>
        <SettingsPage
          has2FA={dbUser?.twoFactorEnabled ?? false}
          hasPassword={!!dbUser?.passwordHash}
        />
      </div>
    </div>
  );
}
