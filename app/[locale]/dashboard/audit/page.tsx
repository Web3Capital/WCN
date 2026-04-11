import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuditConsole } from "./ui";
import { can } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const hasAccess = can(session.user.role, "read", "audit");

  if (!hasAccess) {
    return (
      <div className="dashboard-page section">
        <div className="container">
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

  const actions = await prisma.auditLog.groupBy({ by: ["action"], _count: true, orderBy: { _count: { action: "desc" } } });
  const actionList = actions.map((a) => a.action);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow"><T>Admin</T></span>
        <h1><T>Audit log</T></h1>
        <p className="muted"><T>Browse system events — status changes, creations, settlements, and role updates.</T></p>
        <div className="card" style={{ marginTop: 18 }}>
          <AuditConsole initial={logs as any} actions={actionList} />
        </div>
      </div>
    </div>
  );
}
