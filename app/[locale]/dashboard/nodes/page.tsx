import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NodesConsole } from "./ui";
import { redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Nodes", "Manage network nodes");

const LIST_LIMIT = 100;

export default async function NodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  const prisma = getPrisma();
  const [statusGroups, rawNodes] = await Promise.all([
    prisma.node.groupBy({ by: ["status"], _count: true }),
    prisma.node.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIST_LIMIT + 1,
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const hasMore = rawNodes.length > LIST_LIMIT;
  const pageNodes = hasMore ? rawNodes.slice(0, LIST_LIMIT) : rawNodes;
  const nextCursor = hasMore ? pageNodes[pageNodes.length - 1]!.id : null;
  const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count]));
  const safeNodes = isAdmin ? pageNodes : pageNodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Network</T></span>
        <h1><T>Node registry</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Create, review, and manage nodes.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <NodesConsole
            initial={safeNodes}
            readOnly={!isAdmin}
            initialMeta={{
              nextCursor,
              hasMore,
              limit: LIST_LIMIT,
              statusCounts,
            }}
          />
        </div>
      </div>
    </div>
  );
}

