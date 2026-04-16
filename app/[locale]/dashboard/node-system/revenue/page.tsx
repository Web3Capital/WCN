import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";

export const dynamic = "force-dynamic";
export const metadata = dashboardMeta("Revenue", "Node revenue metrics");

export default async function RevenuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Revenue</T></h1>
        <p className="muted"><T>This section is coming soon.</T></p>
      </div>
    </div>
  );
}
