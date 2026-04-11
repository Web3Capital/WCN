import { requirePermission } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ApprovalsUI } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";

export default async function ApprovalsPage() {
  const auth = await requirePermission("read", "approval");
  if (!auth.ok) redirect("/dashboard");
  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow"><T>Verification</T></span>
        <h1><T>Approvals</T></h1>
        <p className="muted"><T>Review and approve pending items.</T></p>
        <ApprovalsUI />
      </div>
    </div>
  );
}
