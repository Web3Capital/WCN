import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProjectsConsole } from "./ui";
import { getOwnedNodeIds, memberProjectsWhere } from "@/lib/member-data-scope";
import { redactProjectForMember, redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Projects", "Manage projects");

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;

  const prisma = getPrisma();
  const ownedNodeIds = isAdmin ? [] : await getOwnedNodeIds(prisma, userId);
  const projectWhere = isAdmin ? {} : memberProjectsWhere(ownedNodeIds);

  // ProjectsConsole reads id/name/sector/stage/status/internalScore/createdAt
  // (see projects/ui.tsx). Project model has many additional scalar/JSON
  // fields the list view doesn't render — narrow accordingly.
  const [projects, nodes] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        sector: true,
        stage: true,
        status: true,
        internalScore: true,
        createdAt: true,
        nodeId: true,
        node: { select: { id: true, name: true } },
      },
    }),
    prisma.node.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, name: true, type: true },
    }),
  ]);

  const safeProjects = isAdmin ? projects : projects.map((p) => redactProjectForMember(p, userId));
  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Network</T></span>
        <h1><T>Project Pool</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Intake, review, and manage projects across the network pipeline.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <ProjectsConsole
            initial={JSON.parse(JSON.stringify(safeProjects))}
            nodes={JSON.parse(JSON.stringify(safeNodes))}
            readOnly={!isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
