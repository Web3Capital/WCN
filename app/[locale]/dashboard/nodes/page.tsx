import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/[locale]/dashboard/_components/read-only-banner";
import { NodesConsole } from "./ui";
import { redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  const prisma = getPrisma();
  const nodes = await prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Network</span>
        <h1>Node registry</h1>
        <p className="muted">Create, review, and manage nodes.</p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div className="card" style={{ marginTop: 18 }}>
          <NodesConsole initial={safeNodes} readOnly={!isAdmin} />
        </div>
      </div>
    </div>
  );
}

