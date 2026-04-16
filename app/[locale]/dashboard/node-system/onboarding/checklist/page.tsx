import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { CheckCircle2, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("14-Day Checklist", "Onboarding milestone checklist");

const CHECKLIST_ITEMS = [
  { title: "Profile complete", icon: "user" },
  { title: "Team invited", icon: "users" },
  { title: "First deal created", icon: "briefcase" },
  { title: "First task assigned", icon: "task" },
  { title: "KYC submitted", icon: "shield" },
  { title: "Proof of business verified", icon: "document" },
  { title: "Banking info confirmed", icon: "bank" },
  { title: "Compliance review passed", icon: "check" },
  { title: "Territory assigned", icon: "map" },
  { title: "First capital match", icon: "trending-up" },
  { title: "Contract signed", icon: "signature" },
  { title: "Go-live approved", icon: "rocket" },
];

export default async function ChecklistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>14-Day Onboarding Checklist</T></h1>
        <p className="muted">
          <T>Standard milestones for node activation</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Required items</T></h3>
          </div>
          <div className="dashboard-onboarding-checklist-items">
            {CHECKLIST_ITEMS.map((item, idx) => (
              <div key={idx} className="dashboard-onboarding-checklist-item">
                <div className="dashboard-onboarding-checklist-icon">
                  <Circle size={20} className="text-gray-300" />
                </div>
                <div className="dashboard-onboarding-checklist-content">
                  <div className="dashboard-onboarding-checklist-title">{item.title}</div>
                  <div className="dashboard-onboarding-checklist-meta">
                    <span className="text-xs muted">Not yet started</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
