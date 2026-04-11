import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/[locale]/dashboard/_components/read-only-banner";
import { SettlementConsole } from "./ui";
import { redactSettlementCycleForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";

export const dynamic = "force-dynamic";

export default async function SettlementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  const prisma = getPrisma();
  const cycles = await prisma.settlementCycle.findMany({ orderBy: { startAt: "desc" }, take: 50 });
  const safeCycles = isAdmin ? cycles : cycles.map(redactSettlementCycleForMember);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow"><T>Verification</T></span>
        <h1><T>Settlement</T></h1>
        <p className="muted"><T>Create cycles, generate lines, and export allocations.</T></p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div className="card" style={{ marginTop: 18 }}>
          <SettlementConsole initial={safeCycles as any} readOnly={!isAdmin} />
        </div>
      </div>
    </div>
  );
}

