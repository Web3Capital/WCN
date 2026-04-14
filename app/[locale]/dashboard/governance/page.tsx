import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { redirect } from "next/navigation";
import { GovernanceDashboard } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
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
        <span className="eyebrow"><T>Governance</T></span>
        <h1><T>Governance</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Create proposals, vote, and shape WCN network decisions.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <GovernanceDashboard proposals={proposals as any} userId={auth.session.user!.id} />
        </div>
      </div>
    </div>
  );
}
