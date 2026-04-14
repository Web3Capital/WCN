import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { CapitalConsole } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Capital", "Capital management");
export default async function CapitalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  let where: Record<string, unknown> = {};
  if (!isAdmin) {
    const ownedNodes = await prisma.node.findMany({
      where: { ownerUserId: session.user.id },
      select: { id: true },
    });
    where = { nodeId: { in: ownedNodes.map((n) => n.id) } };
  }

  const [profiles, statusCounts, nodes] = await Promise.all([
    prisma.capitalProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { node: { select: { id: true, name: true } } },
    }),
    prisma.capitalProfile.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    }),
    isAdmin
      ? prisma.node.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 })
      : prisma.node.findMany({ where: { ownerUserId: session.user.id }, select: { id: true, name: true } }),
  ]);

  const totalDeployed = profiles.reduce((sum, p) => sum + (p.totalDeployed ?? 0), 0);
  const activeCount = profiles.filter((p) => p.status === "ACTIVE" || p.status === "WARM" || p.status === "IN_DD").length;
  const avgTicket = profiles.filter((p) => p.ticketMin != null && p.ticketMax != null).length > 0
    ? profiles.reduce((sum, p) => sum + ((p.ticketMin ?? 0) + (p.ticketMax ?? 0)) / 2, 0) / profiles.filter((p) => p.ticketMin != null).length
    : 0;

  const stats = {
    total: profiles.length,
    active: activeCount,
    totalDeployed,
    avgTicket: Math.round(avgTicket),
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])),
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Network</T></span>
        <h1><T>Capital Profiles</T></h1>
        <p className="muted"><T>Manage investor profiles, pipeline, preferences, and deployment metrics.</T></p>
        <CapitalConsole
          initialProfiles={JSON.parse(JSON.stringify(profiles))}
          nodes={nodes}
          isAdmin={isAdmin}
          stats={stats}
        />
      </div>
    </div>
  );
}
