import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/dashboard/_components/read-only-banner";
import { SettlementConsole } from "./ui";
import { redactSettlementCycleForMember } from "@/lib/member-redact";

export const dynamic = "force-dynamic";

export default async function SettlementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";

  const prisma = getPrisma();
  const cycles = await prisma.settlementCycle.findMany({ orderBy: { startAt: "desc" }, take: 50 });
  const safeCycles = isAdmin ? cycles : cycles.map(redactSettlementCycleForMember);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Settlement</h1>
        <p className="muted">Create cycles, generate lines, and export allocations.</p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div className="card" style={{ marginTop: 18 }}>
          <SettlementConsole initial={safeCycles as any} readOnly={!isAdmin} />
        </div>
      </div>
    </div>
  );
}

