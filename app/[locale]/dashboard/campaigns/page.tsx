import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { redirect } from "next/navigation";
import { CampaignDashboard } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const metadata = dashboardMeta("Distribution Campaigns", "Manage distribution campaigns, channels, and metrics.");

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
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Growth</T></span>
        <h1><T>Distribution Campaigns</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Manage distribution campaigns, channels, and performance metrics.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <CampaignDashboard campaigns={campaigns as any} />
        </div>
      </div>
    </div>
  );
}
