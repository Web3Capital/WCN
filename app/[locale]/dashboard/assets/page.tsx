import Link from "next/link";
import { PageHeader } from "../_components";

export const dynamic = "force-dynamic";

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
              Settlement formalization
            </div>
            <p className="muted mt-0 mb-0">
              Phase 2 periodic allocation continues; Phase 3 hardens policy versioning, audit trails, and export paths
              that can anchor to external settlement rails.
            </p>
          </div>
          <div className="card">
            <div className="pill mb-10">
              Identity &amp; issuance
            </div>
            <p className="muted mt-0 mb-0">
              Node and agent identities gain standardized credentials; issuance and liquidity programs stay gated until
              PoB and agent governance signals are green (see WCN roadmap docs).
            </p>
          </div>
        </div>

        <div className="card mt-14">
          <p className="muted mt-0 mb-0">
            This page is available to every signed-in member as a roadmap anchor. Executable minting, bridge, or wallet
            flows will appear here as engineering milestones land—without changing the console navigation structure.
          </p>
          <p className="mt-14 mb-0">
            <Link href="/dashboard">Console home</Link>
            {" · "}
            <Link href="/how-it-works">How it works</Link>
            {" · "}
            <Link href="/wiki">Wiki</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
