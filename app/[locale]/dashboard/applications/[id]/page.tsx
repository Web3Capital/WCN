import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { ApplicationDetail } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Application Details", "View application details");
export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!application) redirect("/dashboard/applications");

  if (!isAdmin && application.userId !== session.user.id) {
    redirect("/dashboard/applications");
  }

  const reviews = await prisma.review.findMany({
    where: { targetType: "APPLICATION", targetId: params.id },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { name: true, email: true } } },
    take: 20,
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <ApplicationDetail
          application={JSON.parse(JSON.stringify(application))}
          reviews={JSON.parse(JSON.stringify(reviews))}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
