import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Territory Conflicts", "View and resolve territory conflicts");

export default async function ConflictsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  // Get disputed territories
  const disputes = await prisma.territory.findMany({
    where: { status: "DISPUTED" },
    orderBy: { createdAt: "desc" },
    include: {
      node: {
        select: { id: true, name: true },
      },
    },
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow">
          <T>Territory Management</T>
        </span>
        <h1>
          <T>Territory Conflicts</T>
        </h1>
        <p className="muted">
          <T>Territory conflicts detection and resolution.</T>
        </p>

        <div className="mt-14">
          {disputes.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
              }}
            >
              <p className="muted">
                <T>No territory conflicts detected.</T>
              </p>
              <p className="text-sm muted" style={{ marginTop: "0.5rem" }}>
                <T>The system continuously monitors for overlapping claims and exclusive territory violations.</T>
              </p>
            </div>
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
                      <T>Region</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Scope</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Node</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Notes</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Created</T>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr
                      key={dispute.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "0.75rem" }}>{dispute.region}</td>
                      <td style={{ padding: "0.75rem" }}>{dispute.scope}</td>
                      <td style={{ padding: "0.75rem" }}>
                        {dispute.node?.name || "—"}
                      </td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                        {dispute.notes || "—"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="text-sm muted">
                          {new Date(dispute.createdAt).toLocaleDateString()}
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
