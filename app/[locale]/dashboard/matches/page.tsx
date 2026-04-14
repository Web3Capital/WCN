import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { MatchesConsole } from "./ui";
import { PageHeader } from "@/app/[locale]/dashboard/_components";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Matches", "View matching opportunities");

export default async function MatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  let nodeIds: string[] = [];
  if (!isAdmin) {
    const ownedNodes = await prisma.node.findMany({
      where: { ownerUserId: session.user.id },
      select: { id: true },
    });
    nodeIds = ownedNodes.map((n) => n.id);
  }

  const where: Record<string, unknown> = isAdmin
    ? {}
    : {
        OR: [
          { project: { nodeId: { in: nodeIds } } },
          { capitalNodeId: { in: nodeIds } },
        ],
      };

  const matches = await prisma.match.findMany({
    where,
    orderBy: { score: "desc" },
    take: 200,
    include: {
      project: { select: { id: true, name: true, sector: true, stage: true, status: true } },
      capitalProfile: {
        select: {
          id: true, name: true, status: true, investmentFocus: true,
          ticketMin: true, ticketMax: true,
        },
      },
    },
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <PageHeader
          eyebrow="Network"
          title="Matches"
          subtitle="AI-scored pairings between projects and capital profiles."
        />
        <MatchesConsole
          initialMatches={JSON.parse(JSON.stringify(matches))}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
