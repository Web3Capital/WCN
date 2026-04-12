import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ApplicationsTable } from "./ui";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Applications", "Node applications");
export default async function ApplicationsPage() {
  const prisma = getPrisma();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  const applications = await prisma.application.findMany({
    where: isAdmin ? undefined : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow"><T>Admin</T></span>
        <h1><T>Node applications</T></h1>
        <p className="muted">
          {isAdmin
            ? <T>Review and update application status.</T>
            : <T>Your submissions linked to this account (read-only). Admins see the full queue.</T>}
        </p>
        {!isAdmin && applications.length === 0 ? (
          <div className="card" style={{ marginTop: 18 }}>
            <p className="muted" style={{ margin: 0 }}>
              <T>No applications tied to this login yet.</T>
            </p>
            <p style={{ marginTop: 14, marginBottom: 0 }}>
              <Link href="/apply"><T>Apply as a node</T></Link>
              {" · "}
              <Link href="/dashboard"><T>Back to console</T></Link>
            </p>
          </div>
        ) : (
          <div className="card" style={{ marginTop: 18 }}>
            <ApplicationsTable initial={applications} readOnly={!isAdmin} />
          </div>
        )}
      </div>
    </div>
  );
}

