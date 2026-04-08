import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ApplicationsTable } from "./ui";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const prisma = getPrisma();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const applications = await prisma.application.findMany({
    where: isAdmin ? undefined : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Node applications</h1>
        <p className="muted">
          {isAdmin
            ? "Review and update application status."
            : "Your submissions linked to this account (read-only). Admins see the full queue."}
        </p>
        {!isAdmin && applications.length === 0 ? (
          <div className="card" style={{ marginTop: 18 }}>
            <p className="muted" style={{ margin: 0 }}>
              No applications tied to this login yet.
            </p>
            <p style={{ marginTop: 14, marginBottom: 0 }}>
              <Link href="/apply">Apply as a node</Link>
              {" · "}
              <Link href="/dashboard">Back to console</Link>
            </p>
          </div>
        ) : (
          <div className="card" style={{ marginTop: 18 }}>
            <ApplicationsTable initial={applications} readOnly={!isAdmin} />
          </div>
        )}
      </div>
    </main>
  );
}

