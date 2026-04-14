import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuditConsole } from "./ui";
import { can } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Audit Log", "System audit trail");
export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const hasAccess = can(session.user.role, "read", "audit");

  if (!hasAccess) {
    return (
      <div className="dashboard-page section">
        <div className="container-wide">
          <span className="eyebrow"><T>Governance</T></span>
          <h1><T>Audit log</T></h1>
          <div className="card" style={{ marginTop: 18, padding: "14px 16px" }}>
            <p className="muted" style={{ margin: 0 }}>
              <T>You do not have permission to view the audit log.</T>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const prisma = getPrisma();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true, email: true } } }
  });

  const actionGroups = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: true,
    orderBy: { _count: { action: "desc" } },
  });
  const actionCounts: Record<string, number> = {};
  for (const row of actionGroups) {
    actionCounts[row.action] = row._count;
  }
  const actionList = [...Object.keys(actionCounts)].sort((a, b) => a.localeCompare(b));

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Admin</T></span>
        <h1><T>Audit log</T></h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          <T>Browse system events — status changes, creations, settlements, and role updates.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <AuditConsole initial={logs as any} actions={actionList} actionCounts={actionCounts} />
        </div>
      </div>
    </div>
  );
}
