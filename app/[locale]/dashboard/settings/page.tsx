import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { SettingsPage } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Settings", "Console settings");
export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const t = await getTranslations("dashboard.settingsPage");
  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, passwordHash: true },
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide" style={{ maxWidth: 720 }}>
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1>{t("title")}</h1>
        <p className="muted">{t("subtitle")}</p>
        <SettingsPage
          has2FA={dbUser?.twoFactorEnabled ?? false}
          hasPassword={!!dbUser?.passwordHash}
        />
      </div>
    </div>
  );
}
