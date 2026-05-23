import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { UsersConsole } from "./ui";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Users", "User management");
export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);
  const t = await getTranslations("dashboard.usersPage");

  if (!isAdmin) {
    return (
      <div className="dashboard-page section">
        <div className="container-wide">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <div className="card" style={{ marginTop: 18, padding: "14px 16px" }}>
            <p className="muted" style={{ margin: 0 }}>
              {t("nonAdmin")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { nodes: true, applications: true } }
    }
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1>{t("title")}</h1>
        <p className="muted">{t("subtitle")}</p>
        <div className="card" style={{ marginTop: 18 }}>
          <UsersConsole initial={users as any} currentUserId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
