import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SettlementConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function SettlementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const prisma = getPrisma();
  const cycles = await prisma.settlementCycle.findMany({ orderBy: { startAt: "desc" }, take: 50 });

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Settlement</h1>
        <p className="muted">Create cycles, generate lines, and export allocations.</p>
        <div className="card" style={{ marginTop: 18 }}>
          <SettlementConsole initial={cycles as any} />
        </div>
      </div>
    </main>
  );
}

