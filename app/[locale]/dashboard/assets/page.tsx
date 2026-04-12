import Link from "next/link";
import { PageHeader } from "../_components";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Assets", "Asset management");
export default function AssetsPhase3Page() {
  return (
    <div className="dashboard-page section">
      <div className="container">
        <PageHeader
          eyebrow="Roadmap"
          title="Assets & on-chain proofs"
          subtitle="Third-version track: mature settlement inputs, stronger identity and location records, and selective movement of summaries, attestations, and liquidity-related artifacts toward chain-backed storage when the network is ready."
        />

        <div className="grid-2 mt-18">
          <div className="card">
            <div className="pill mb-10">
              <T>Settlement formalization</T>
            </div>
            <p className="muted mt-0 mb-0">
              <T>Phase 2 periodic allocation continues; Phase 3 hardens policy versioning, audit trails, and export paths
              that can anchor to external settlement rails.</T>
            </p>
          </div>
          <div className="card">
            <div className="pill mb-10">
              <T>Identity & issuance</T>
            </div>
            <p className="muted mt-0 mb-0">
              <T>Node and agent identities gain standardized credentials; issuance and liquidity programs stay gated until
              PoB and agent governance signals are green (see WCN roadmap docs).</T>
            </p>
          </div>
        </div>

        <div className="card mt-14">
          <p className="muted mt-0 mb-0">
            <T>This page is available to every signed-in member as a roadmap anchor. Executable minting, bridge, or wallet
            flows will appear here as engineering milestones land—without changing the console navigation structure.</T>
          </p>
          <p className="mt-14 mb-0">
            <Link href="/dashboard"><T>Console home</T></Link>
            {" · "}
            <Link href="/how-it-works"><T>How it works</T></Link>
            {" · "}
            <Link href="/wiki"><T>Wiki</T></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
