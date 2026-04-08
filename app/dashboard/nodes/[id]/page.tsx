import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { ReadOnlyBanner } from "@/app/dashboard/_components/read-only-banner";
import { NodeGovernance } from "./ui";

export const dynamic = "force-dynamic";

export default async function NodeDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";

  const prisma = getPrisma();
  const node = await prisma.node.findUnique({
    where: { id: params.id },
    include: {
      seats: { orderBy: { createdAt: "desc" } },
      stakeLedger: { orderBy: { createdAt: "desc" } },
      penalties: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!node) notFound();

  if (!isAdmin && node.ownerUserId !== session.user.id) {
    redirect("/dashboard/nodes");
  }

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Dashboard / Nodes</span>
        <h1>{node.name}</h1>
        <p className="muted">{node.type} · {node.status} · Level {node.level} · {node.region || "No region"}</p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div style={{ marginTop: 18 }}>
          <NodeGovernance
            nodeId={node.id}
            initialSeats={node.seats as any}
            initialStake={node.stakeLedger as any}
            initialPenalties={node.penalties as any}
            readOnly={!isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
