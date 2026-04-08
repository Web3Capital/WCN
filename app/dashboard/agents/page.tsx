import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/dashboard/_components/read-only-banner";
import { AgentsConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";

  const prisma = getPrisma();
  const [agents, nodes] = await Promise.all([
    prisma.agent.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { ownerNode: true, permissions: true } }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Agents</h1>
        <p className="muted">Register agents, grant permissions, and inspect execution logs.</p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div className="card" style={{ marginTop: 18 }}>
          <AgentsConsole initial={agents as any} nodes={nodes as any} readOnly={!isAdmin} />
        </div>
      </div>
    </main>
  );
}

