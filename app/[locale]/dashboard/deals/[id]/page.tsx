import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { getOwnedNodeIds } from "@/lib/member-data-scope";
import { DealDetail } from "./ui";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, session.user.id);
    const hasAccess = await prisma.deal.findFirst({
      where: {
        id: params.id,
        OR: [
          { project: { node: { id: { in: ownedNodeIds } } } },
          { participants: { some: { nodeId: { in: ownedNodeIds } } } },
        ],
      },
      select: { id: true },
    });
    if (!hasAccess) redirect("/dashboard/deals");
  }

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true, status: true, sector: true } },
      capital: { select: { id: true, name: true, status: true } },
      leadNode: { select: { id: true, name: true } },
      participants: { include: { node: { select: { id: true, name: true } } }, orderBy: { joinedAt: "asc" } },
      milestones: { orderBy: { createdAt: "asc" } },
      notes: { orderBy: { createdAt: "desc" }, take: 50 },
      tasks: { select: { id: true, title: true, status: true, type: true }, orderBy: { createdAt: "desc" }, take: 30 },
      evidence: { select: { id: true, title: true, type: true, reviewStatus: true }, take: 20 },
      pobRecords: { select: { id: true, businessType: true, status: true, score: true }, take: 10 },
      _count: { select: { participants: true, milestones: true, notes: true, tasks: true, evidence: true } },
    },
  });

  if (!deal) redirect("/dashboard/deals");

  const nodes = isAdmin
    ? await prisma.node.findMany({ where: { status: "LIVE" }, select: { id: true, name: true }, take: 200 })
    : await prisma.node.findMany({ where: { ownerUserId: session.user.id }, select: { id: true, name: true } });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <DealDetail deal={JSON.parse(JSON.stringify(deal))} nodes={nodes} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
