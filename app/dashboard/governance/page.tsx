import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { redirect } from "next/navigation";
import { GovernanceDashboard } from "./ui";

export const metadata = { title: "Governance – WCN" };

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
    <>
      <div className="page-header">
        <h1>Governance</h1>
        <p className="muted">Create proposals, vote, and shape WCN network decisions.</p>
      </div>
      <GovernanceDashboard proposals={proposals as any} userId={auth.session.user!.id} />
    </>
  );
}
