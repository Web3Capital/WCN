import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuditConsole } from "./ui";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) {
    return (
      <div className="dashboard-page section">
        <div className="container">
          <span className="eyebrow">Admin</span>
          <h1>Audit log</h1>
          <div className="card" style={{ marginTop: 18, padding: "14px 16px" }}>
            <p className="muted" style={{ margin: 0 }}>
              The audit log is only available to administrators.
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
        <span className="eyebrow">Admin</span>
        <h1>Audit log</h1>
        <p className="muted">Browse system events — status changes, creations, settlements, and role updates.</p>
        <div className="card" style={{ marginTop: 18 }}>
          <AuditConsole initial={logs as any} actions={actionList} />
        </div>
      </div>
    </div>
  );
}
