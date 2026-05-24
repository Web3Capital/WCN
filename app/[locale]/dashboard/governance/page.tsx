import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { redirect } from "next/navigation";
import { GovernanceDashboard } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { PageHeader } from "@/app/[locale]/dashboard/_components/page-header";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const metadata = dashboardMeta("Governance", "Create proposals, vote, and shape network decisions.");

export default async function GovernancePage() {
  const auth = await requireSignedIn();
  if (!auth.ok) redirect("/login");

  const prisma = getPrisma();
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: { votes: { select: { id: true, voterId: true, option: true, weight: true } } },
    take: 50,
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <PageHeader
          eyebrow={<T>Governance</T>}
          title={<T>Governance</T>}
          subtitle={<T>Create proposals, vote, and shape WCN network decisions.</T>}
        />
        <div style={{ marginTop: 24 }}>
          <GovernanceDashboard proposals={proposals as any} userId={auth.session.user!.id} />
        </div>
      </div>
    </div>
  );
}
