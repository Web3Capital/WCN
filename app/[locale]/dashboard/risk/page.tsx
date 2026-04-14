import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { RiskConsole } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Risk Console", "Risk monitoring and management");
export default async function RiskPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!can(session.user.role, "read", "risk")) redirect("/dashboard");

  const prisma = getPrisma();

  const flags = await prisma.riskFlag.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const openCount = flags.filter((f) => !f.resolvedAt).length;
  const criticalCount = flags.filter((f) => f.severity === "CRITICAL" && !f.resolvedAt).length;

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Intelligence</T></span>
        <h1><T>Risk & Compliance</T></h1>
        <p className="muted">
          {openCount} open flags · {criticalCount} critical
        </p>
        <RiskConsole initialFlags={JSON.parse(JSON.stringify(flags))} />
      </div>
    </div>
  );
}
