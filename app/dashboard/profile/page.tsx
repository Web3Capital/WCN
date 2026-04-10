import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { ProfilePage } from "./ui";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      accountStatus: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { nodes: true, applications: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="dashboard-page section">
      <div className="container" style={{ maxWidth: 720 }}>
        <span className="eyebrow">Account</span>
        <h1>Profile</h1>
        <p className="muted">Manage your personal information.</p>
        <ProfilePage user={JSON.parse(JSON.stringify(user))} />
      </div>
    </div>
  );
}
