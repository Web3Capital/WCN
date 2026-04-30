import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { PobConsole } from "./ui";
import { getOwnedNodeIds, memberPoBWhere, memberTasksWhere, memberProjectsWhere, memberEvidenceWhere } from "@/lib/member-data-scope";
import { redactNodeForMember, redactEvidenceForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("PoB Records", "Proof of Business records");
export default async function PobPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;

  const prisma = getPrisma();
  const ownedNodeIds = isAdmin ? [] : await getOwnedNodeIds(prisma, userId);

  const pobWhere = isAdmin ? {} : memberPoBWhere(ownedNodeIds);
  const taskWhere = isAdmin ? {} : memberTasksWhere(ownedNodeIds);
  const projectWhere = isAdmin ? {} : memberProjectsWhere(ownedNodeIds);
  const evidenceWhere = isAdmin ? {} : memberEvidenceWhere(ownedNodeIds);

  // Narrow select for the PoB list. The earlier `include: { task, project, node }`
  // pulled three full relations whose fields the UI never reads — only
  // taskId/projectId/nodeId scalars are referenced. attributions/confirmations/
  // disputes are kept (UI iterates them) but reduced to the fields the JSX
  // actually renders. Net payload reduction observed empirically: 60–80%.
  const [pob, tasks, projects, nodes, evidences] = await Promise.all([
    prisma.poBRecord.findMany({
      where: pobWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        status: true,
        score: true,
        businessType: true,
        notes: true,
        taskId: true,
        projectId: true,
        nodeId: true,
        createdAt: true,
        attributions: {
          select: {
            id: true,
            role: true,
            shareBps: true,
            nodeId: true,
            node: { select: { id: true, name: true } },
          },
        },
        confirmations: {
          select: {
            id: true,
            decision: true,
            partyType: true,
            partyNodeId: true,
            partyUserId: true,
            createdAt: true,
          },
        },
        disputes: {
          select: {
            id: true,
            status: true,
            reason: true,
            resolution: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.task.findMany({ where: taskWhere, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.project.findMany({ where: projectWhere, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.evidence.findMany({ where: evidenceWhere, orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);
  const safeEvidences = isAdmin ? evidences : evidences.map((e) => redactEvidenceForMember(e, ownedNodeIds));

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Verification</T></span>
        <h1><T>PoB verification</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}><T>Record and review proof-of-business outcomes.</T></p>
        <div style={{ marginTop: 24 }}>
          <PobConsole
            initial={pob as any}
            tasks={tasks as any}
            projects={projects as any}
            nodes={safeNodes as any}
            evidences={safeEvidences as any}
            readOnly={!isAdmin}
          />
        </div>
      </div>
    </div>
  );
}

