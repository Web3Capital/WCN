import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { redirect } from "next/navigation";
import { CampaignDashboard } from "./ui";

export const metadata = { title: "Campaigns – WCN" };

export default async function CampaignsPage() {
  const auth = await requirePermission("read", "node");
  if (!auth.ok) redirect("/login");

  const prisma = getPrisma();
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      channels: { select: { id: true, nodeId: true, channel: true, status: true } },
      metrics: { select: { id: true, metricType: true, value: true, recordedAt: true } },
    },
    take: 50,
  });

  return (
    <>
      <div className="page-header">
        <h1>Distribution Campaigns</h1>
        <p className="muted">Manage distribution campaigns, channels, and performance metrics.</p>
      </div>
      <CampaignDashboard campaigns={campaigns as any} />
    </>
  );
}
