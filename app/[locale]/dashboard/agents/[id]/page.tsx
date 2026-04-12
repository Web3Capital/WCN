import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { getOwnedNodeIds } from "@/lib/member-data-scope";
import { AgentDetailUI } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Agent Details", "View agent details");
export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, session.user.id);
    const scoped = await prisma.agent.findFirst({
      where: { id, ownerNodeId: { in: ownedNodeIds } },
      select: { id: true },
    });
    if (!scoped) redirect("/dashboard/agents");
  }

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      ownerNode: { select: { id: true, name: true } },
      permissions: { orderBy: { createdAt: "desc" } },
      logs: { orderBy: { createdAt: "desc" }, take: 50 },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 50,
        include: { task: { select: { id: true, title: true } } },
      },
    },
  });
  if (!agent) redirect("/dashboard/agents");

  return (
    <div className="dashboard-page section">
      <div className="container">
        <AgentDetailUI agent={JSON.parse(JSON.stringify(agent))} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
