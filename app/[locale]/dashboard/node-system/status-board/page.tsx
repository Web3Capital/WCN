import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const metadata = dashboardMeta("Status Board", "Node status overview");

export default async function StatusBoardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const nodes = await prisma.node.findMany({
    select: { id: true, name: true, status: true, type: true },
    take: 500,
  });

  // Group nodes by status
  const statusGroups = nodes.reduce(
    (acc, node) => {
      const status = node.status || "UNKNOWN";
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(node);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const statuses = Object.keys(statusGroups).sort();

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Status Board</T></h1>
        <p className="muted"><T>Overview of nodes grouped by status.</T></p>

        <div className="grid-3 mt-18">
          {statuses.map((status) => (
            <div key={status} className="card">
              <div className="card-header">
                <h3>{status}</h3>
                <span className="badge badge-accent">{statusGroups[status].length}</span>
              </div>
              <div className="flex-col gap-8 mt-12">
                {statusGroups[status].slice(0, 10).map((node) => (
                  <div key={node.id} className="text-sm">
                    <div className="font-medium">{node.name}</div>
                    <div className="muted text-xs">{node.type}</div>
                  </div>
                ))}
                {statusGroups[status].length > 10 && (
                  <div className="muted text-xs font-medium">
                    <T>{`+ ${statusGroups[status].length - 10} more`}</T>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex gap-10">
          <Link href="/dashboard/node-system" className="button button-secondary">
            <T>Back to Overview</T>
          </Link>
        </div>
      </div>
    </div>
  );
}
