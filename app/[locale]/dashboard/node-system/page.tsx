import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { AlertCircle, CheckCircle2, Clock, Shield, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Node System Overview", "Node system status and KPIs");

export default async function NodeSystemPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin) {
    return (
      <div className="dashboard-page section">
        <div className="container-wide">
          <span className="eyebrow"><T>Admin</T></span>
          <h1><T>Node System Overview</T></h1>
          <div className="card" style={{ marginTop: 18, padding: "14px 16px" }}>
            <p className="muted" style={{ margin: 0 }}>
              <T>Node system overview is only available to administrators.</T>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const prisma = getPrisma();

  // Fetch all KPI data in parallel
  const [
    totalNodes,
    activeNodes,
    pendingApplications,
    probationNodes,
    statusCounts,
  ] = await Promise.all([
    prisma.node.count(),
    prisma.node.count({
      where: { status: "LIVE" },
    }),
    prisma.application.count({
      where: { status: "PENDING" },
    }),
    prisma.node.count({
      where: { status: "PROBATION" },
    }),
    prisma.node.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  // Sort status counts for display
  const sortedStatusCounts = statusCounts
    .sort((a, b) => b._count - a._count)
    .slice(0, 10); // Top 10 statuses

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node Operations</T></span>
        <h1><T>Node System Overview</T></h1>
        <p className="muted"><T>System-wide node registry and health metrics</T></p>

        {/* KPI Cards */}
        <div className="grid-4 card-grid-animated mt-18">
          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-accent"><T>Registry</T></span>
              <Shield size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{totalNodes}</div>
            <div className="stat-label"><T>Total Nodes</T></div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-green"><T>Active</T></span>
              <CheckCircle2 size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{activeNodes}</div>
            <div className="stat-label"><T>Live Nodes</T></div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-amber"><T>Applications</T></span>
              <Clock size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{pendingApplications}</div>
            <div className="stat-label"><T>Pending Applications</T></div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-purple"><T>Compliance</T></span>
              <AlertCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{probationNodes}</div>
            <div className="stat-label"><T>In Probation</T></div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Node Status Distribution</T></h3>
          </div>

          {sortedStatusCounts.length === 0 ? (
            <div style={{ padding: "24px 16px" }}>
              <p className="muted" style={{ margin: 0 }}>
                <T>No nodes found in the system.</T>
              </p>
            </div>
          ) : (
            <div style={{ overflow: "auto" }}>
              <table className="status-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", paddingLeft: 16 }}>
                      <T>Status</T>
                    </th>
                    <th style={{ textAlign: "right", paddingRight: 16 }}>
                      <T>Count</T>
                    </th>
                    <th style={{ textAlign: "right", paddingRight: 16 }}>
                      <T>Percentage</T>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStatusCounts.map((item) => {
                    const percentage = totalNodes > 0
                      ? ((item._count / totalNodes) * 100).toFixed(1)
                      : "0.0";

                    return (
                      <tr key={item.status}>
                        <td style={{ paddingLeft: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              className="status-dot"
                              style={{
                                background: getStatusColor(item.status),
                              }}
                            />
                            <span className="mono">{item.status}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 16 }}>
                          <strong>{item._count}</strong>
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 16 }}>
                          <span className="muted">{percentage}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="grid-3 mt-14">
          <div className="card">
            <h4 style={{ margin: "0 0 12px 0" }}><T>Quick Facts</T></h4>
            <div className="flex-col gap-8">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted"><T>Health Score</T></span>
                <span style={{ fontWeight: 600 }}>
                  {totalNodes > 0 ? ((activeNodes / totalNodes) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted"><T>At Risk</T></span>
                <span style={{ fontWeight: 600, color: "var(--color-warn)" }}>
                  {probationNodes + (statusCounts.find(s => s.status === "SUSPENDED")?._count || 0)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted"><T>Pending Review</T></span>
                <span style={{ fontWeight: 600 }}>
                  {statusCounts.find(s => s.status === "SUBMITTED")?._count || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ margin: "0 0 12px 0" }}><T>Applications Pipeline</T></h4>
            <div className="flex-col gap-8">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted"><T>Pending</T></span>
                <span style={{ fontWeight: 600 }}>{pendingApplications}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted"><T>Requires Action</T></span>
                <span style={{ fontWeight: 600, color: "var(--color-info)" }}>
                  {pendingApplications > 0 ? pendingApplications : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ margin: "0 0 12px 0" }}><T>System Health</T></h4>
            <div className="flex-col gap-8">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted"><T>Total Nodes</T></span>
                <span style={{ fontWeight: 600 }}>{totalNodes}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="muted"><T>Operating</T></span>
                <span style={{ fontWeight: 600, color: "var(--color-success)" }}>
                  {activeNodes}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    LIVE: "var(--color-success, #10b981)",
    ACTIVE: "var(--color-success, #10b981)",
    DRAFT: "var(--color-muted, #6b7280)",
    SUBMITTED: "var(--color-accent, #f59e0b)",
    UNDER_REVIEW: "var(--color-accent, #f59e0b)",
    NEED_MORE_INFO: "var(--color-warn, #f97316)",
    APPROVED: "var(--color-success, #10b981)",
    REJECTED: "var(--color-error, #ef4444)",
    CONTRACTING: "var(--color-info, #3b82f6)",
    WATCHLIST: "var(--color-warn, #f97316)",
    PROBATION: "var(--color-warn, #f97316)",
    SUSPENDED: "var(--color-error, #ef4444)",
    OFFBOARDED: "var(--color-muted, #6b7280)",
  };

  return colorMap[status] || "var(--color-muted, #d1d5db)";
}
