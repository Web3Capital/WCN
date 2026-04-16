import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/permissions";
import { Link } from "@/i18n/routing";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Territory Management", "Manage node territories and claims");

const LIST_LIMIT = 200;

export default async function TerritoryManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  const allTerritories = await prisma.territory.findMany({
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    include: {
      node: {
        select: { id: true, name: true },
      },
    },
  });

  // Count territories by status
  const totalCount = await prisma.territory.count();
  const activeCount = await prisma.territory.count({
    where: { status: "ACTIVE" },
  });
  const exclusiveCount = await prisma.territory.count({
    where: { exclusivity: "EXCLUSIVE" },
  });
  const conflictCount = 0; // Placeholder for conflicts detection

  const statusLabels: Record<string, string> = {
    ACTIVE: "Active",
    DISPUTED: "Disputed",
    REVOKED: "Revoked",
  };

  const exclusivityLabels: Record<string, string> = {
    NONE: "None",
    CONDITIONAL: "Conditional",
    EXCLUSIVE: "Exclusive",
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow">
          <T>Node System</T>
        </span>
        <h1>
          <T>Territory Management</T>
        </h1>
        <p className="muted">
          <T>Manage node territories, regional claims, and exclusivity agreements.</T>
        </p>

        {/* KPI Cards */}
        <div className="kpi-grid mt-8">
          <div className="kpi">
            <div className="font-bold text-lg">{totalCount}</div>
            <div className="text-sm muted">
              <T>Total Territories</T>
            </div>
          </div>
          <div className="kpi">
            <div className="font-bold text-lg">{activeCount}</div>
            <div className="text-sm muted">
              <T>Active</T>
            </div>
          </div>
          <div className="kpi">
            <div className="font-bold text-lg">{exclusiveCount}</div>
            <div className="text-sm muted">
              <T>Exclusive</T>
            </div>
          </div>
          <div className="kpi">
            <div className="font-bold text-lg">{conflictCount}</div>
            <div className="text-sm muted">
              <T>Conflicts</T>
            </div>
          </div>
        </div>

        {/* Filter Links */}
        <div className="mt-8" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            href="/dashboard/node-system/territory/region-claims"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f0f0",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            <T>Region Claims</T>
          </Link>
          <Link
            href="/dashboard/node-system/territory/vertical-claims"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f0f0",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            <T>Vertical Claims</T>
          </Link>
          <Link
            href="/dashboard/node-system/territory/protected"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f0f0",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            <T>Protected Accounts</T>
          </Link>
          <Link
            href="/dashboard/node-system/territory/conflicts"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f0f0",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            <T>Conflicts</T>
          </Link>
          <Link
            href="/dashboard/node-system/territory/exclusivity"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f0f0",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            <T>Exclusivity</T>
          </Link>
        </div>

        {/* Territories List */}
        <div className="mt-14">
          <h2 className="font-bold">
            <T>All Territories</T>
          </h2>
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
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
                    <T>Region</T>
                  </th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>
                    <T>Scope</T>
                  </th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>
                    <T>Exclusivity</T>
                  </th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>
                    <T>Node</T>
                  </th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>
                    <T>Status</T>
                  </th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>
                    <T>KPI Target</T>
                  </th>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>
                    <T>Created</T>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allTerritories.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "2rem", textAlign: "center" }}>
                      <T>No territories found</T>
                    </td>
                  </tr>
                ) : (
                  allTerritories.map((territory) => (
                    <tr
                      key={territory.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "0.75rem" }}>{territory.region}</td>
                      <td style={{ padding: "0.75rem" }}>{territory.scope}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="badge">
                          {exclusivityLabels[territory.exclusivity] ||
                            territory.exclusivity}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <Link
                          href={`/dashboard/nodes/${territory.nodeId}`}
                          style={{ color: "#0066cc", textDecoration: "none" }}
                        >
                          {territory.node?.name || "—"}
                        </Link>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="badge">
                          {statusLabels[territory.status] || territory.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                        {territory.kpiTarget
                          ? JSON.stringify(territory.kpiTarget).substring(0, 40)
                          : "—"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="text-sm muted">
                          {new Date(territory.createdAt).toLocaleDateString()}
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
