import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/[locale]/dashboard/_components/read-only-banner";
import { NodesConsole } from "./ui";
import { redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Nodes", "Manage network nodes");
export default async function NodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  const prisma = getPrisma();
  const nodes = await prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Network</T></span>
        <h1><T>Node registry</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Create, review, and manage nodes.</T>
        </p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div style={{ marginTop: 24 }}>
          <NodesConsole initial={safeNodes} readOnly={!isAdmin} />
        </div>
      </div>
    </div>
  );
}

