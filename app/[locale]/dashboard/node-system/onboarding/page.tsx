import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Users, Clock, CheckCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Node Onboarding", "Monitor nodes in onboarding phase");

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const [nodes, totalCount, pendingCount, probationCount] = await Promise.all([
    prisma.node.findMany({
      where: {
        status: { in: ["CONTRACTING", "PROBATION", "ACTIVE"] },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        owner: { select: { name: true, email: true } },
      },
    }),
    prisma.node.count({
      where: { status: { in: ["CONTRACTING", "PROBATION", "ACTIVE"] } },
    }),
    prisma.node.count({
      where: { status: "CONTRACTING" },
    }),
    prisma.node.count({
      where: { status: "PROBATION" },
    }),
  ]);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "CONTRACTING":
        return "badge badge-accent";
      case "PROBATION":
        return "badge badge-amber";
      case "ACTIVE":
        return "badge badge-green";
      default:
        return "badge";
    }
  };

  const statusLabel = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Onboarding</T></h1>
        <p className="muted">
          <T>Track nodes through onboarding, probation, and activation phases</T>
        </p>

        <div className="kpi-grid mt-18">
          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-accent"><T>Total</T></span>
              <Users size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label"><T>Nodes in phase</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-amber"><T>Pending</T></span>
              <Clock size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label"><T>Onboarding</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-purple"><T>Probation</T></span>
              <CheckCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{probationCount}</div>
            <div className="stat-label"><T>In probation</T></div>
          </div>
        </div>

        <div className="grid-3 mt-14">
          <Link href="/dashboard/node-system/onboarding/checklist" className="quick-action">
            <div className="quick-action-icon"><CheckCircle size={18} /></div>
            <div>
              <div className="quick-action-title"><T>14-Day Checklist</T></div>
              <div className="quick-action-desc"><T>View onboarding items</T></div>
            </div>
          </Link>
          <Link href="/dashboard/node-system/onboarding/pending" className="quick-action">
            <div className="quick-action-icon"><Clock size={18} /></div>
            <div>
              <div className="quick-action-title"><T>Pending Go-Live</T></div>
              <div className="quick-action-desc">
                {pendingCount} <T>nodes</T>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/node-system/onboarding/probation" className="quick-action">
            <div className="quick-action-icon"><Users size={18} /></div>
            <div>
              <div className="quick-action-title"><T>Probation</T></div>
              <div className="quick-action-desc">
                {probationCount} <T>nodes</T>
              </div>
            </div>
          </Link>
        </div>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Nodes in onboarding phase</T></h3>
          </div>
          {nodes.length === 0 ? (
            <div className="empty-state">
              <p className="muted"><T>No nodes found in onboarding phase</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Name</T></th>
                  <th><T>Status</T></th>
                  <th><T>Owner</T></th>
                  <th><T>Created</T></th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node: any) => (
                  <tr key={node.id}>
                    <td>
                      <Link href={`/dashboard/nodes/${node.id}`} className="link">
                        {node.name}
                      </Link>
                    </td>
                    <td>
                      <span className={statusBadgeClass(node.status)}>
                        {statusLabel(node.status)}
                      </span>
                    </td>
                    <td className="text-sm">{node.owner?.name || node.owner?.email || "—"}</td>
                    <td className="text-sm muted">
                      {new Date(node.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
