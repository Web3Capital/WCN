import { redirect } from "next/navigation";
import { requireSignedIn } from "@/lib/admin";
import { ApiKeysUI } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const metadata = dashboardMeta("API Keys", "Create keys for agents and integrations.");

export default async function ApiKeysPage() {
  const auth = await requireSignedIn();
  if (!auth.ok) redirect("/login");

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Developers</T></span>
        <h1><T>API Keys</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Create API keys for agents and external systems to access WCN.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <ApiKeysUI />
        </div>
      </div>
    </div>
  );
}
