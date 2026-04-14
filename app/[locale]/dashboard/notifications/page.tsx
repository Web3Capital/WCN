import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { NotificationsUI } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Notifications", "View notifications");
export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Console</T></span>
        <h1><T>Notifications</T></h1>
        <NotificationsUI notifications={JSON.parse(JSON.stringify(notifications))} />
      </div>
    </div>
  );
}
