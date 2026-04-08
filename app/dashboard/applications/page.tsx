import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApplicationsTable } from "./ui";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const prisma = getPrisma();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Node applications</h1>
        <p className="muted">Review and update application status.</p>
        <div className="card" style={{ marginTop: 18 }}>
          <ApplicationsTable initial={applications} />
        </div>
      </div>
    </main>
  );
}

