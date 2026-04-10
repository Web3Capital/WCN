import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/[locale]/dashboard/_components/read-only-banner";
import { ProjectsConsole } from "./ui";
import { getOwnedNodeIds, memberProjectsWhere } from "@/lib/member-data-scope";
import { redactProjectForMember, redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;

  const prisma = getPrisma();
  const ownedNodeIds = isAdmin ? [] : await getOwnedNodeIds(prisma, userId);
  const projectWhere = isAdmin ? {} : memberProjectsWhere(ownedNodeIds);

  const [projects, nodes] = await Promise.all([
    prisma.project.findMany({ where: projectWhere, orderBy: { createdAt: "desc" }, take: 200, include: { node: true } }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  const safeProjects = isAdmin ? projects : projects.map((p) => redactProjectForMember(p, userId));
  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Network</span>
        <h1>Project pool</h1>
        <p className="muted">Intake and review projects and their needs.</p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div className="card" style={{ marginTop: 18 }}>
          <ProjectsConsole initial={safeProjects as any} nodes={safeNodes as any} readOnly={!isAdmin} />
        </div>
      </div>
    </div>
  );
}

