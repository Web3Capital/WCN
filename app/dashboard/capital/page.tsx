import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { CapitalConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function CapitalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  let where: Record<string, unknown> = {};
  if (!isAdmin) {
    const ownedNodes = await prisma.node.findMany({
      where: { ownerUserId: session.user.id },
      select: { id: true },
    });
    where = { nodeId: { in: ownedNodes.map((n) => n.id) } };
  }

  const profiles = await prisma.capitalProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { node: { select: { id: true, name: true } } },
  });

  const nodes = isAdmin
    ? await prisma.node.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 })
    : await prisma.node.findMany({ where: { ownerUserId: session.user.id }, select: { id: true, name: true } });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Capital Pool</span>
        <h1>Capital Profiles</h1>
        <p className="muted">Manage investor profiles, preferences, and activity.</p>
        <CapitalConsole
          initialProfiles={JSON.parse(JSON.stringify(profiles))}
          nodes={nodes}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
