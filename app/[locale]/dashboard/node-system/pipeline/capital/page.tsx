import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Link } from "@/i18n/routing";
import { Landmark } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Capital Deals", "Capital-type deals in pipeline");

export default async function CapitalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      leadNode: { select: { id: true, name: true } },
      capital: { select: { id: true, name: true } },
    },
  });

  // Filter to deals with associated capital profiles
  const capitalDeals = deals.filter((d) => d.capital);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Capital Deals</T></h1>
        <p className="muted">
          <T>Deals between nodes and capital sources</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Capital-type deals</T></h3>
            <span className="badge badge-sm">{capitalDeals.length}</span>
          </div>
          {capitalDeals.length === 0 ? (
            <div className="empty-state">
              <Landmark size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No capital deals found</T></p>
              <p className="muted text-xs mt-8"><T>Capital-linked deals will appear here</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Deal Title</T></th>
                  <th><T>Capital Source</T></th>
                  <th><T>Lead Node</T></th>
                  <th><T>Stage</T></th>
                  <th><T>Created</T></th>
                </tr>
              </thead>
              <tbody>
                {capitalDeals.map((deal: any) => (
                  <tr key={deal.id}>
                    <td>
                      <Link href={`/dashboard/deals/${deal.id}`} className="link">
                        {deal.title}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/dashboard/capital/${deal.capital.id}`} className="link">
                        {deal.capital.name}
                      </Link>
                    </td>
                    <td className="text-sm">
                      <Link href={`/dashboard/nodes/${deal.leadNode.id}`} className="link">
                        {deal.leadNode.name}
                      </Link>
                    </td>
                    <td className="text-sm">{deal.stage.replace(/_/g, " ")}</td>
                    <td className="text-sm muted">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
