import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NodesConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function NodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const prisma = getPrisma();
  const nodes = await prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Node registry</h1>
        <p className="muted">Create, review, and manage nodes.</p>
        <div className="card" style={{ marginTop: 18 }}>
          <NodesConsole initial={nodes} />
        </div>
      </div>
    </main>
  );
}

