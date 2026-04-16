import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/permissions";
import { Link } from "@/i18n/routing";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Node Registry", "View and manage all network nodes");

const LIST_LIMIT = 200;

export default async function NodeRegistryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  const [nodeTypeGroups, allNodes] = await Promise.all([
    prisma.node.groupBy({
      by: ["type"],
      _count: true,
      orderBy: { type: "asc" },
    }),
    prisma.node.findMany({
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  const nodeTypeCounts = Object.fromEntries(
    nodeTypeGroups.map((g) => [g.type, g._count])
  );

  const nodeTypeLabels: Record<string, string> = {
    GLOBAL: "Global",
    REGION: "Regional",
    CITY: "City",
    INDUSTRY: "Vertical",
    FUNCTIONAL: "Functional",
    AGENT: "Agent",
  };

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

  const statusColors: Record<string, string> = {
    DRAFT: "#999",
    SUBMITTED: "#0066cc",
    UNDER_REVIEW: "#ff9900",
    NEED_MORE_INFO: "#ff9900",
    APPROVED: "#00aa00",
    REJECTED: "#dd0000",
    CONTRACTING: "#0066cc",
    LIVE: "#00aa00",
    WATCHLIST: "#ff6600",
    PROBATION: "#ff9900",
    SUSPENDED: "#dd0000",
    OFFBOARDED: "#666",
    ACTIVE: "#00aa00",
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow">
          <T>Node System</T>
        </span>
        <h1>
          <T>Node Registry</T>
        </h1>
        <p className="muted">
          <T>View all nodes grouped by type. Filter by specific node categories.</T>
        </p>

        {/* KPI Cards */}
        <div className="kpi-grid mt-8">
          {["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"].map(
            (type) => (
              <Link
                key={type}
                href={`/dashboard/node-system/registry/${type.toLowerCase()}`}
                className="kpi"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <div className="font-bold text-lg">
                  {nodeTypeCounts[type] || 0}
                </div>
                <div className="text-sm muted">{nodeTypeLabels[type]}</div>
              </Link>
            )
          )}
        </div>

        {/* All Nodes List */}
        <div className="mt-14">
          <h2 className="font-bold">
            <T>All Nodes</T>
          </h2>
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table
              className="dashboard-registry-table"
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
                    <T>Type</T>
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
                {allNodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>
                      <T>No nodes found</T>
                    </td>
                  </tr>
                ) : (
                  allNodes.map((node) => (
                    <tr
                      key={node.id}
                      className="dashboard-registry-table-row"
                      style={{
                        borderBottom: "1px solid var(--line)",
                      }}
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
                        <span className="badge">{nodeTypeLabels[node.type] || node.type}</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: statusColors[node.status] || "#999",
                            color: "white",
                          }}
                        >
                          {statusLabels[node.status] || node.status}
                        </span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
