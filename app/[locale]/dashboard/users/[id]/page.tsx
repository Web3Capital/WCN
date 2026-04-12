import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { UserDetail } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("User Details", "View user details");
export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      nodes: { select: { id: true, name: true, type: true, status: true }, orderBy: { createdAt: "desc" } },
      applications: { select: { id: true, status: true, applicantName: true, nodeType: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { nodes: true, applications: true } },
    },
  });

  if (!user) redirect("/dashboard/users");

  const recentActivity = await prisma.auditLog.findMany({
    where: { actorUserId: params.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, action: true, targetType: true, targetId: true, createdAt: true },
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <UserDetail
          user={JSON.parse(JSON.stringify(user))}
          activity={JSON.parse(JSON.stringify(recentActivity))}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
