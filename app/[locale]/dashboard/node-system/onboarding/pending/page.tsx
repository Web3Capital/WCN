import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Link } from "@/i18n/routing";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Pending Go-Live", "Nodes awaiting activation");

export default async function PendingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const nodes = await prisma.node.findMany({
    where: {
      status: "CONTRACTING",
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
        <h1><T>Pending Go-Live</T></h1>
        <p className="muted">
          <T>Nodes in onboarding status waiting for activation</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Nodes pending activation</T></h3>
            <span className="badge badge-sm">{nodes.length}</span>
          </div>
          {nodes.length === 0 ? (
            <div className="empty-state">
              <Clock size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No nodes pending go-live</T></p>
              <p className="muted text-xs mt-8"><T>All nodes have been activated</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Name</T></th>
                  <th><T>Owner</T></th>
                  <th><T>Onboarding Score</T></th>
                  <th><T>Created</T></th>
                  <th><T>Days in phase</T></th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node: any) => {
                  const daysInPhase = Math.floor(
                    // Server component runs once per request — Date.now() is per-request, not per-render
                    // eslint-disable-next-line react-hooks/purity
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
                      <td>
                        <span className="font-bold">
                          {node.onboardingScore || "—"}
                        </span>
                      </td>
                      <td className="text-sm muted">
                        {new Date(node.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-sm">{daysInPhase} days</td>
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
