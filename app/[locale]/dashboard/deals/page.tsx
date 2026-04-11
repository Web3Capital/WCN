import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { DealsConsole } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
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
    const nodeIds = ownedNodes.map((n) => n.id);
    where = {
      OR: [
        { leadNodeId: { in: nodeIds } },
        { participants: { some: { nodeId: { in: nodeIds } } } },
      ],
    };
  }

  const deals = await prisma.deal.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      project: { select: { id: true, name: true } },
      capital: { select: { id: true, name: true } },
      leadNode: { select: { id: true, name: true } },
      _count: { select: { participants: true, milestones: true, tasks: true } },
    },
  });

  const nodes = isAdmin
    ? await prisma.node.findMany({ where: { status: "LIVE" }, select: { id: true, name: true }, take: 200 })
    : await prisma.node.findMany({ where: { ownerUserId: session.user.id }, select: { id: true, name: true } });

  const projects = await prisma.project.findMany({
    where: isAdmin ? { status: { in: ["ACTIVE", "CURATED", "IN_DEAL_ROOM"] } } : {},
    select: { id: true, name: true },
    take: 200,
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow"><T>Network</T></span>
        <h1><T>Deals</T></h1>
        <p className="muted"><T>Each deal is an auditable business event — not a chat thread.</T></p>
        <DealsConsole
          initialDeals={JSON.parse(JSON.stringify(deals))}
          nodes={nodes}
          projects={projects}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
