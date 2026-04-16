import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("PoB Disputes", "Disputes and appeals on PoB decisions");

export default async function DisputesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>PoB Disputes</T></h1>
        <p className="muted">
          <T>Appeals and disputes on proof of business decisions</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Active disputes</T></h3>
            <span className="badge badge-sm">0</span>
          </div>
          <div className="empty-state">
            <AlertTriangle size={40} className="empty-state-icon" />
            <p className="text-sm"><T>No active disputes</T></p>
            <p className="muted text-xs mt-8"><T>Disputes will be tracked and managed here</T></p>
          </div>
        </div>

        <div className="card mt-14">
          <h3><T>Dispute resolution workflow</T></h3>
          <div className="mt-8">
            <div className="section-block">
              <h4><T>Overview</T></h4>
              <p className="text-sm muted">
                <T>Nodes can dispute proof of business rejections or request appeals. Disputes are reviewed by the compliance team and resolved through documented evidence and investigation.</T>
              </p>
            </div>
            <div className="section-block mt-6">
              <h4><T>Process</T></h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li><T>Node submits dispute with supporting documentation</T></li>
                <li><T>Compliance team reviews and investigates</T></li>
                <li><T>Decision is communicated to node</T></li>
                <li><T>If upheld, node may resubmit with new evidence</T></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
