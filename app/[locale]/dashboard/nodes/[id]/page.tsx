import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { redactNodeForMember } from "@/lib/member-redact";
import { NodeDetail } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Node Details", "View node details");
export default async function NodeDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  const node = await prisma.node.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      projects: { select: { id: true, name: true, status: true }, take: 30 },
      tasksAsOwner: { select: { id: true, title: true, status: true }, take: 30, orderBy: { createdAt: "desc" } },
      ownedAgents: { select: { id: true, name: true, status: true, type: true } },
      dealsAsLead: { select: { id: true, title: true, stage: true }, take: 30, orderBy: { createdAt: "desc" } },
      _count: { select: { pobRecords: true, settlementLines: true } },
    },
  });

  if (!node) redirect("/dashboard/nodes");

  const data = isAdmin || node.ownerUserId === session.user.id
    ? node
    : redactNodeForMember(node);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <NodeDetail node={JSON.parse(JSON.stringify(data))} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
