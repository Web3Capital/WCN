import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { getOwnedNodeIds, memberEvidenceWhere } from "@/lib/member-data-scope";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { ProofDeskConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function ProofDeskPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);
  const isReviewer = ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK"].includes(session.user.role);

  let where: Record<string, unknown> = {};
  if (!isAdmin) {
    const nodeIds = await getOwnedNodeIds(prisma, session.user.id);
    where = memberEvidenceWhere(nodeIds);
  }

  const evidences = await prisma.evidence.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
      node: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
    },
  });

  const reviewQueue = isReviewer
    ? await prisma.evidence.findMany({
        where: { reviewStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        orderBy: { slaDeadlineAt: "asc" },
        take: 100,
        include: {
          task: { select: { id: true, title: true } },
          node: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      })
    : [];

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow"><T>Verification</T></span>
        <h1><T>Evidence & Review</T></h1>
        <p className="muted"><T>Submit evidence, track review progress, and manage the reviewer queue.</T></p>
        <ProofDeskConsole
          evidences={JSON.parse(JSON.stringify(evidences))}
          reviewQueue={JSON.parse(JSON.stringify(reviewQueue))}
          isAdmin={isAdmin}
          isReviewer={isReviewer}
        />
      </div>
    </div>
  );
}
