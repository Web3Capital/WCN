import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { NodeReviewUI } from "./ui";

export const dynamic = "force-dynamic";

export default async function NodeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  const isReviewer = ["REVIEWER", "RISK_DESK"].includes(session.user.role);
  if (!isAdmin && !isReviewer) redirect(`/dashboard/nodes/${id}`);

  const prisma = getPrisma();
  const node = await prisma.node.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!node) redirect("/dashboard/nodes");

  const reviews = await prisma.review.findMany({
    where: { targetType: "NODE", targetId: id },
    include: { reviewer: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <NodeReviewUI
          node={JSON.parse(JSON.stringify(node))}
          reviews={JSON.parse(JSON.stringify(reviews))}
        />
      </div>
    </div>
  );
}
