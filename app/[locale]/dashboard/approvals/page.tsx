import { requirePermission } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ApprovalsUI } from "./ui";

export default async function ApprovalsPage() {
  const auth = await requirePermission("read", "approval");
  if (!auth.ok) redirect("/dashboard");
  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Verification</span>
        <h1>Approvals</h1>
        <p className="muted">Review and approve pending items.</p>
        <ApprovalsUI />
      </div>
    </div>
  );
}
