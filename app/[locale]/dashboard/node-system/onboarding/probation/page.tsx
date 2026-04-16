import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Link } from "@/i18n/routing";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Probation Nodes", "Nodes in probation status");

export default async function ProbationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const nodes = await prisma.node.findMany({
    where: {
      status: "PROBATION",
    },
    orderBy: { probationStartAt: "desc" },
    take: 200,
    include: {
      owner: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Probation</T></h1>
        <p className="muted">
          <T>Nodes under probation monitoring</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Nodes in probation</T></h3>
            <span className="badge badge-sm badge-amber">{nodes.length}</span>
          </div>
          {nodes.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No nodes in probation</T></p>
              <p className="muted text-xs mt-8"><T>All nodes have passed probation or not yet entered it</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Name</T></th>
                  <th><T>Owner</T></th>
                  <th><T>Probation Start</T></th>
                  <th><T>Probation End</T></th>
                  <th><T>Days remaining</T></th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node: any) => {
                  const endDate = node.probationEndAt ? new Date(node.probationEndAt) : null;
                  const daysRemaining = endDate
                    ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <tr key={node.id}>
                      <td>
                        <Link href={`/dashboard/nodes/${node.id}`} className="link">
                          {node.name}
                        </Link>
                      </td>
                      <td className="text-sm">{node.owner?.name || node.owner?.email || "—"}</td>
                      <td className="text-sm muted">
                        {node.probationStartAt
                          ? new Date(node.probationStartAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="text-sm muted">
                        {node.probationEndAt
                          ? new Date(node.probationEndAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="text-sm">
                        {daysRemaining !== null ? (
                          <span className={daysRemaining < 7 ? "font-bold text-red-600" : ""}>
                            {daysRemaining} days
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
