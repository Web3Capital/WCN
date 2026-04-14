import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { InviteConsole } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Invites", "Manage invitations");
export default async function InvitesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { createdBy: { select: { name: true, email: true } } },
  });

  const serialized = invites.map((inv) => ({
    id: inv.id,
    email: inv.email,
    tokenHash: inv.tokenHash.slice(0, 8) + "…",
    role: inv.role,
    expiresAt: inv.expiresAt.toISOString(),
    activatedAt: inv.activatedAt?.toISOString() ?? null,
    revokedAt: inv.revokedAt?.toISOString() ?? null,
    createdBy: inv.createdBy?.name || inv.createdBy?.email || "—",
    createdAt: inv.createdAt.toISOString(),
  }));

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Admin</T></span>
        <h1><T>Invite Management</T></h1>
        <p className="muted"><T>Create and manage invitations to the WCN network.</T></p>
        <InviteConsole initialInvites={serialized} />
      </div>
    </div>
  );
}
