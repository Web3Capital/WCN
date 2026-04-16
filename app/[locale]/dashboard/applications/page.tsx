import { redirect } from "next/navigation";

/**
 * Consolidated: node applications are now managed via the Node System.
 * The detail page at /dashboard/applications/[id] is still active.
 */
export default function ApplicationsPage() {
  redirect("/dashboard/node-system/applications");
}
