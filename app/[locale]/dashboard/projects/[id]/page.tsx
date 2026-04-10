import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { redactProjectForMember } from "@/lib/member-redact";
import { ProjectDetail } from "./ui";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      node: { select: { id: true, name: true, ownerUserId: true } },
      tasks: { select: { id: true, title: true, status: true, type: true }, take: 30, orderBy: { createdAt: "desc" } },
      pobRecords: { select: { id: true, businessType: true, score: true, status: true }, take: 10 },
      evidence: { select: { id: true, title: true, type: true, reviewStatus: true, createdAt: true }, take: 30, orderBy: { createdAt: "desc" } },
      deals: { select: { id: true, title: true, stage: true } },
      _count: { select: { tasks: true, pobRecords: true, evidence: true, deals: true } },
    },
  });

  if (!project) redirect("/dashboard/projects");

  const data = isAdmin ? project : redactProjectForMember(project, session.user.id);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <ProjectDetail project={JSON.parse(JSON.stringify(data))} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
