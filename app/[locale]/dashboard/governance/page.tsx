import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { redirect } from "next/navigation";
import { GovernanceDashboard } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";

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
        <h1><T>Governance</T></h1>
        <p className="muted"><T>Create proposals, vote, and shape WCN network decisions.</T></p>
      </div>
      <GovernanceDashboard proposals={proposals as any} userId={auth.session.user!.id} />
    </>
  );
}
