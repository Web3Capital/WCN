import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { NodeBillingUI } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Node Billing", "Node billing information");
export default async function NodeBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const node = await prisma.node.findUnique({
    where: { id },
    include: {
      seats: { orderBy: { createdAt: "desc" }, take: 20 },
      stakeLedger: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!node) redirect("/dashboard/nodes");

  const isAdmin = isAdminRole(session.user.role);
  const isOwner = node.ownerUserId === session.user.id;
  if (!isAdmin && !isOwner) redirect(`/dashboard/nodes/${id}`);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Network</T></span>
        <NodeBillingUI node={JSON.parse(JSON.stringify(node))} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
