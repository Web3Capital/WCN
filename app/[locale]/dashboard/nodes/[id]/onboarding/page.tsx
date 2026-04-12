import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { NodeOnboardingUI } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Node Onboarding", "Node onboarding process");
export default async function NodeOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const node = await prisma.node.findUnique({
    where: { id },
    include: {
      projects: { select: { id: true, name: true, status: true }, take: 10 },
      tasksAsOwner: { select: { id: true, title: true, status: true }, take: 10, orderBy: { createdAt: "desc" } },
    },
  });
  if (!node) redirect("/dashboard/nodes");

  const isAdmin = isAdminRole(session.user.role);
  const isOwner = node.ownerUserId === session.user.id;
  if (!isAdmin && !isOwner) redirect(`/dashboard/nodes/${id}`);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <NodeOnboardingUI node={JSON.parse(JSON.stringify(node))} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
