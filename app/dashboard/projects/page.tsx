import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/dashboard/_components/read-only-banner";
import { ProjectsConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";

  const prisma = getPrisma();
  const [projects, nodes] = await Promise.all([
    prisma.project.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { node: true } }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Project pool</h1>
        <p className="muted">Intake and review projects and their needs.</p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div className="card" style={{ marginTop: 18 }}>
          <ProjectsConsole initial={projects as any} nodes={nodes as any} readOnly={!isAdmin} />
        </div>
      </div>
    </main>
  );
}

