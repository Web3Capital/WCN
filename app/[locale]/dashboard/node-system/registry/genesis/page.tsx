import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/permissions";
import { Link } from "@/i18n/routing";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Genesis Nodes", "View genesis level nodes");

export default async function GenesisNodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();
  const nodes = await prisma.node.findMany({
    where: { type: "GLOBAL" },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node Registry</T></span>
        <h1><T>Genesis Nodes</T></h1>
        <p className="muted"><T>Global-level core nodes in the network.</T></p>

        <div className="mt-14">
          {nodes.length === 0 ? (
            <p className="muted"><T>No genesis nodes found.</T></p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}><T>Name</T></th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}><T>Status</T></th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}><T>Owner</T></th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}><T>Created</T></th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr key={node.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem" }}>
                        <Link href={`/dashboard/nodes/${node.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                          {node.name}
                        </Link>
                      </td>
                      <td style={{ padding: "0.75rem" }}><span className="badge">{node.status}</span></td>
                      <td style={{ padding: "0.75rem" }}>{node.owner?.name || "—"}</td>
                      <td style={{ padding: "0.75rem" }} className="text-sm muted">{new Date(node.createdAt).toLocaleDateString()}</td>
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
