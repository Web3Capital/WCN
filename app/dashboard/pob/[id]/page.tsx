import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { getOwnedNodeIds, memberPoBWhere } from "@/lib/member-data-scope";
import { PobDetail } from "./ui";

export const dynamic = "force-dynamic";

export default async function PobDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, session.user.id);
    const allowed = await prisma.poBRecord.findFirst({
      where: { id: params.id, ...memberPoBWhere(ownedNodeIds) },
      select: { id: true },
    });
    if (!allowed) redirect("/dashboard/pob");
  }

  const record = await prisma.poBRecord.findUnique({
    where: { id: params.id },
    include: {
      task: { select: { id: true, title: true, status: true } },
      project: { select: { id: true, name: true } },
      node: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, stage: true } },
      attributions: { include: { node: { select: { id: true, name: true } } } },
      confirmations: { orderBy: { createdAt: "desc" } },
      disputes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!record) redirect("/dashboard/pob");

  const reviews = isAdmin
    ? await prisma.review.findMany({
        where: { targetType: "POB", targetId: params.id },
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { name: true, email: true } } },
        take: 20,
      })
    : [];

  return (
    <div className="dashboard-page section">
      <div className="container">
        <PobDetail
          record={JSON.parse(JSON.stringify(record))}
          reviews={JSON.parse(JSON.stringify(reviews))}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
