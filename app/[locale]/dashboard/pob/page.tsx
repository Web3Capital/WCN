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

  const [pob, tasks, projects, nodes, evidences] = await Promise.all([
    prisma.poBRecord.findMany({
      where: pobWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { task: true, project: true, node: true, attributions: { include: { node: true } }, confirmations: true, disputes: true }
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

