import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/admin";
import { IngestionUI } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const metadata = dashboardMeta("Data Ingestion", "Configure external data sources for agents.");

export default async function IngestionPage() {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) redirect("/dashboard");

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Intelligence</T></span>
        <h1><T>Data Ingestion</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Configure external data sources that agents use to import projects and investors.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <IngestionUI />
        </div>
      </div>
    </div>
  );
}
