import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { UsersConsole } from "./ui";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) {
    return (
      <div className="dashboard-page section">
        <div className="container">
          <span className="eyebrow">Dashboard</span>
          <h1>Users</h1>
          <div className="card" style={{ marginTop: 18, padding: "14px 16px" }}>
            <p className="muted" style={{ margin: 0 }}>
              User management is only available to administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { nodes: true, applications: true } }
    }
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Users</h1>
        <p className="muted">Manage user accounts and roles.</p>
        <div className="card" style={{ marginTop: 18 }}>
          <UsersConsole initial={users as any} currentUserId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
