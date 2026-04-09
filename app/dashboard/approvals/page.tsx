import { requirePermission } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ApprovalsUI } from "./ui";

export default async function ApprovalsPage() {
  const auth = await requirePermission("read", "settlement");
  if (!auth.ok) redirect("/login");
  return <ApprovalsUI />;
}
