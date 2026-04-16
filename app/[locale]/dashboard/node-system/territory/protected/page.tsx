import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/permissions";
import { Link } from "@/i18n/routing";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Protected Accounts", "View territories with protected accounts");

export default async function ProtectedAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  const territories = await prisma.territory.findMany({
    where: {
      protectedAccounts: { isEmpty: false },
    },
    orderBy: { createdAt: "desc" },
    include: {
      node: {
        select: { id: true, name: true },
      },
    },
  });

  const statusLabels: Record<string, string> = {
    ACTIVE: "Active",
    DISPUTED: "Disputed",
    REVOKED: "Revoked",
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow">
          <T>Territory Management</T>
        </span>
        <h1>
          <T>Protected Accounts</T>
        </h1>
        <p className="muted">
          <T>Territories with protected accounts.</T>
        </p>

        <div className="mt-14">
          {territories.length === 0 ? (
            <p className="muted">
              <T>No territories with protected accounts found</T>
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
                      <T>Region</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Scope</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Protected Accounts</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Node</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Status</T>
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      <T>Created</T>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {territories.map((territory) => (
                    <tr
                      key={territory.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "0.75rem" }}>{territory.region}</td>
                      <td style={{ padding: "0.75rem" }}>{territory.scope}</td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                        {territory.protectedAccounts.length > 0
                          ? territory.protectedAccounts.slice(0, 2).join(", ") +
                            (territory.protectedAccounts.length > 2
                              ? ` +${territory.protectedAccounts.length - 2}`
                              : "")
                          : "—"}
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
                      <td style={{ padding: "0.75rem" }}>
                        <span className="text-sm muted">
                          {new Date(territory.createdAt).toLocaleDateString()}
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
