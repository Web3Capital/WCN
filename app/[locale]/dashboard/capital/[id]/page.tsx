import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { CapitalDetail } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Capital Details", "View capital details");
export default async function CapitalDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  const profile = await prisma.capitalProfile.findUnique({
    where: { id: params.id },
    include: {
      node: { select: { id: true, name: true, ownerUserId: true } },
      deals: { select: { id: true, title: true, stage: true }, take: 30, orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) redirect("/dashboard/capital");

  const isOwner = profile.node?.ownerUserId === session.user.id;
  const data = isAdmin || isOwner ? profile : { ...profile, contactEmail: null, restrictions: null, blacklist: [] };

  return (
    <div className="dashboard-page section">
      <div className="container">
        <CapitalDetail profile={JSON.parse(JSON.stringify(data))} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
