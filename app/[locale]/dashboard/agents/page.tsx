import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/[locale]/dashboard/_components/read-only-banner";
import { AgentsConsole } from "./ui";
import { getOwnedNodeIds, memberAgentsWhere } from "@/lib/member-data-scope";
import { redactAgentForMember, redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Agents", "AI agent management");

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;

  const prisma = getPrisma();
  const ownedNodeIds = isAdmin ? [] : await getOwnedNodeIds(prisma, userId);
  const agentWhere = isAdmin ? {} : memberAgentsWhere(ownedNodeIds);

  const [agents, nodes] = await Promise.all([
    prisma.agent.findMany({
      where: agentWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        ownerNode: { select: { id: true, name: true } },
        permissions: true,
        _count: { select: { runs: true, logs: true, permissions: true } },
      },
    }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  const safeAgents = isAdmin ? agents : agents.map(redactAgentForMember);
  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Work</T></span>
        <h1><T>Agents</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Register agents, grant permissions, and inspect execution logs.</T>
        </p>
        {!isAdmin && <ReadOnlyBanner />}
        <div style={{ marginTop: 24 }}>
          <AgentsConsole
            initial={JSON.parse(JSON.stringify(safeAgents))}
            nodes={JSON.parse(JSON.stringify(safeNodes))}
            readOnly={!isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
