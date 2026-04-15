import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { canAccessNodeReviewQueue } from "@/lib/permissions";
import { NodeReviewQueueConsole } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

const REVIEW_IN = ["SUBMITTED", "UNDER_REVIEW", "NEED_MORE_INFO"] as const;

export const metadata = dashboardMeta("Node review queue", "Nodes awaiting review");

export default async function NodeReviewQueuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!canAccessNodeReviewQueue(session.user.role)) redirect("/dashboard/nodes");

  const prisma = getPrisma();
  const where = { status: { in: [...REVIEW_IN] } };

  const [rows, groups] = await Promise.all([
    prisma.node.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 300,
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
    prisma.node.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const g of groups) statusCounts[g.status] = g._count;

  const serializable = rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    status: r.status,
    region: r.region,
    city: r.city,
    vertical: r.vertical,
    updatedAt: r.updatedAt.toISOString(),
    owner: r.owner,
  }));

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Network</T></span>
        <h1>
          <T>Node review queue</T>
        </h1>
        <p className="muted">
          <T>Nodes in submitted, under review, or need more information — PRD Node Review entry.</T>
        </p>
        <NodeReviewQueueConsole initialRows={JSON.parse(JSON.stringify(serializable))} statusCounts={statusCounts} />
      </div>
    </div>
  );
}
