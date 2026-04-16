import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/permissions";
import { Link } from "@/i18n/routing";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Regional Nodes", "View regional level nodes");

export default async function RegionalNodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  const nodes = await prisma.node.findMany({
    where: { type: "REGION" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const statusLabels: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    NEED_MORE_INFO: "Need Info",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CONTRACTING: "Contracting",
    LIVE: "Live",
    WATCHLIST: "Watchlist",
    PROBATION: "Probation",
    SUSPENDED: "Suspended",
    OFFBOARDED: "Offboarded",
    ACTIVE: "Active",
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow">
          <T>Node Registry</T>
        </span>
        <h1>
          <T>Regional Nodes</T>
        </h1>
        <p className="muted">
          <T>Regional level nodes in the network.</T>
        </p>

        <div className="mt-14">
          {nodes.length === 0 ? (
            <p className="muted">
              <T>No regional nodes found</T>
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Name</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Status</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Owner</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Region</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Created</T>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr
                      key={node.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "0.75rem" }}>
                        <Link
                          href={`/dashboard/nodes/${node.id}`}
                          style={{ color: "#0066cc", textDecoration: "none" }}
                        >
                          {node.name}
                        </Link>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="badge">{statusLabels[node.status] || node.status}</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ fontSize: "0.875rem" }}>
                          {node.owner?.name || "—"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#999" }}>
                          {node.owner?.email}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {node.region || "—"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="text-sm muted">
                          {new Date(node.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
