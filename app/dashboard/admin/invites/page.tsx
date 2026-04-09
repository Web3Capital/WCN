import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { InviteConsole } from "./ui";

export const dynamic = "force-dynamic";

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
    token: inv.token,
    role: inv.role,
    expiresAt: inv.expiresAt.toISOString(),
    activatedAt: inv.activatedAt?.toISOString() ?? null,
    createdBy: inv.createdBy?.name || inv.createdBy?.email || "—",
    createdAt: inv.createdAt.toISOString(),
  }));

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Admin</span>
        <h1>Invite Management</h1>
        <p className="muted">Create and manage invitations to the WCN network.</p>
        <InviteConsole initialInvites={serialized} />
      </div>
    </div>
  );
}
