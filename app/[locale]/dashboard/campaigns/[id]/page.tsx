import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { CampaignDetail } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Campaign Details", "View campaign details");
export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      channels: true,
      metrics: { orderBy: { recordedAt: "desc" } },
    },
  });

  if (!campaign) redirect("/dashboard/campaigns");

  return (
    <div className="dashboard-page section">
      <div className="container">
        <CampaignDetail campaign={JSON.parse(JSON.stringify(campaign))} />
      </div>
    </div>
  );
}
