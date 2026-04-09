import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { RiskConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function RiskPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  const flags = await prisma.riskFlag.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const openCount = flags.filter((f) => !f.resolvedAt).length;
  const criticalCount = flags.filter((f) => f.severity === "CRITICAL" && !f.resolvedAt).length;

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Risk Console</span>
        <h1>Risk & Compliance</h1>
        <p className="muted">
          {openCount} open flags · {criticalCount} critical
        </p>
        <RiskConsole initialFlags={JSON.parse(JSON.stringify(flags))} />
      </div>
    </div>
  );
}
