import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Link } from "@/i18n/routing";
import { Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Recently Activated", "Nodes recently activated");

export default async function GoLivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  // Nodes that are ACTIVE and were created more than 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const nodes = await prisma.node.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { lt: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      owner: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Recently Activated</T></h1>
        <p className="muted">
          <T>Nodes that went live over 30 days ago</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Active nodes (30+ days)</T></h3>
            <span className="badge badge-sm badge-green">{nodes.length}</span>
          </div>
          {nodes.length === 0 ? (
            <div className="empty-state">
              <Zap size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No recently activated nodes</T></p>
              <p className="muted text-xs mt-8"><T>Nodes activated within the last 30 days will appear here</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Name</T></th>
                  <th><T>Owner</T></th>
                  <th><T>Go-Live Date</T></th>
                  <th><T>Type</T></th>
                  <th><T>Days since activation</T></th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node: any) => {
                  const daysSinceActivation = Math.floor(
                    (Date.now() - new Date(node.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={node.id}>
                      <td>
                        <Link href={`/dashboard/nodes/${node.id}`} className="link">
                          {node.name}
                        </Link>
                      </td>
                      <td className="text-sm">{node.owner?.name || node.owner?.email || "—"}</td>
                      <td className="text-sm muted">
                        {new Date(node.goLiveAt || node.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-sm">{node.type}</td>
                      <td className="text-sm">{daysSinceActivation} days</td>
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
