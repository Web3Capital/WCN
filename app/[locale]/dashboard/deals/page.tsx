import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { ReadOnlyBanner } from "@/app/[locale]/dashboard/_components/read-only-banner";
import { DealsConsole } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Deal Room", "Active deals and negotiations");

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

  const [deals, nodes, projects, capitals] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        project: { select: { id: true, name: true } },
        capital: { select: { id: true, name: true } },
        leadNode: { select: { id: true, name: true } },
        _count: { select: { participants: true, milestones: true, tasks: true } },
      },
    }),
    isAdmin
      ? prisma.node.findMany({ where: { status: "LIVE" }, select: { id: true, name: true }, take: 200 })
      : prisma.node.findMany({ where: { ownerUserId: session.user.id }, select: { id: true, name: true } }),
    prisma.project.findMany({
      where: isAdmin ? { status: { in: ["ACTIVE", "CURATED", "IN_DEAL_ROOM"] } } : {},
      select: { id: true, name: true },
      take: 200,
    }),
    prisma.capitalProfile.findMany({
      where: isAdmin ? {} : { status: "ACTIVE" },
      select: { id: true, name: true },
      take: 200,
    }),
  ]);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Network</T></span>
        <h1><T>Deal Room</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Each deal is an auditable business event — not a chat thread.</T>
        </p>
        {!isAdmin && <ReadOnlyBanner />}
        <div style={{ marginTop: 24 }}>
          <DealsConsole
            initialDeals={JSON.parse(JSON.stringify(deals))}
            nodes={nodes}
            projects={projects}
            capitals={capitals}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
