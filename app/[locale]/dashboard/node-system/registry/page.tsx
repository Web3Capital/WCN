import { redirect } from "next/navigation";

/**
 * Consolidated: the node registry is now at /dashboard/nodes with type KPI cards.
 * Registry sub-pages (/registry/genesis, /registry/regional, etc.) remain active.
 */
export default function NodeRegistryPage() {
  redirect("/dashboard/nodes");
}
