import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { ProfilePage } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Profile", "User profile settings");
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
      <div className="container-wide" style={{ maxWidth: 720 }}>
        <span className="eyebrow"><T>Account</T></span>
        <h1><T>Profile</T></h1>
        <p className="muted"><T>Manage your personal information.</T></p>
        <ProfilePage user={JSON.parse(JSON.stringify(user))} />
      </div>
    </div>
  );
}
