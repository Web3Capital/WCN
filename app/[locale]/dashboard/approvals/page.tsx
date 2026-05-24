import { requirePermission } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ApprovalsUI } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { PageHeader } from "@/app/[locale]/dashboard/_components/page-header";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";


export const metadata = dashboardMeta("Approvals", "Pending approvals");
export default async function ApprovalsPage() {
  const auth = await requirePermission("read", "approval");
  if (!auth.ok) redirect("/dashboard");
  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <PageHeader
          eyebrow={<T>Verification</T>}
          title={<T>Approvals</T>}
          subtitle={<T>Review and approve pending items.</T>}
        />
        <ApprovalsUI />
      </div>
    </div>
  );
}
