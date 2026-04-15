import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NodesConsole } from "./ui";
import { redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole, canAccessNodeReviewQueue } from "@/lib/permissions";
import { Link } from "@/i18n/routing";
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
  const memberListWhere = isAdmin ? undefined : { ownerUserId: session.user.id };

  const [statusGroups, rawNodes] = await Promise.all([
    prisma.node.groupBy({ by: ["status"], _count: true, ...(memberListWhere ? { where: memberListWhere } : {}) }),
    prisma.node.findMany({
      ...(memberListWhere ? { where: memberListWhere } : {}),
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
        <p className="muted">
          <T>Create, review, and manage network nodes, lifecycle, and operations.</T>
        </p>
        {canAccessNodeReviewQueue(session.user.role) ? (
          <p className="muted text-sm mt-8">
            <Link href="/dashboard/nodes/review-queue" className="font-medium" style={{ color: "var(--accent)" }}>
              <T>Open node review queue</T>
            </Link>
            <span className="mx-8">·</span>
            <T>Submitted, under review, and need-more-info nodes.</T>
          </p>
        ) : null}
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
  );
}

