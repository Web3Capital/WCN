import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AssetsPhase3Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard · Phase 3</span>
        <h1>Assets &amp; on-chain proofs</h1>
        <p className="muted">
          Third-version track: mature settlement inputs, stronger identity and location records, and selective movement
          of summaries, attestations, and liquidity-related artifacts toward chain-backed storage when the network is
          ready.
        </p>

        <div className="grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Settlement formalization
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Phase 2 periodic allocation continues; Phase 3 hardens policy versioning, audit trails, and export paths
              that can anchor to external settlement rails.
            </p>
          </div>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Identity &amp; issuance
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Node and agent identities gain standardized credentials; issuance and liquidity programs stay gated until
              PoB and agent governance signals are green (see WCN roadmap docs).
            </p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <p className="muted" style={{ margin: 0 }}>
            This page is available to every signed-in member as a roadmap anchor. Executable minting, bridge, or wallet
            flows will appear here as engineering milestones land—without changing the console navigation structure.
          </p>
          <p style={{ marginTop: 14, marginBottom: 0 }}>
            <Link href="/dashboard">Console home</Link>
            {" · "}
            <Link href="/how-it-works">How it works</Link>
            {" · "}
            <Link href="/docs">Docs</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
