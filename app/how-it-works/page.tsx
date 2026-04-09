const loop = [
  ["Resource intake", "Projects, capital, media, services, and regional connections enter through nodes."],
  ["Task structuring", "Business needs become tasks with clear owners, collaborators, and milestones."],
  ["Human + Agent execution", "Humans provide judgment and relationships; agents scale research and operations."],
  ["Evidence verification", "Contracts, logs, dashboards, and on-chain proofs are attached and reviewed."],
  ["PoB record", "Only closed loops become PoB, forming an auditable value ledger."],
  ["Settlement (Phase 2)", "PoB competes for a periodic allocation pool; governance and staking follow."]
];

const layers = [
  { label: "Human nodes layer", desc: "Resources, trust, accountability", width: "100%" },
  { label: "Agent execution layer", desc: "Research, matching, operations", width: "88%" },
  { label: "PoB verification layer", desc: "Evidence, review, risk checks", width: "76%" },
  { label: "Settlement layer", desc: "Allocation, staking, governance", width: "64%" },
  { label: "Asset layer", desc: "On-chain identity, issuance, liquidity", width: "52%" }
];

export default function HowItWorksPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">How It Works</span>
        <h1>From resources to verified outcomes.</h1>
        <p className="muted" style={{ maxWidth: 900 }}>
          WCN is not "activity rewards." It is a business loop: structure work, execute with humans + agents, verify with
          evidence, and record PoB as the basis for future settlement.
        </p>
        <div className="grid-3 card-grid-animated">
          {loop.map(([title, description], i) => (
            <div className="card step-card" key={title}>
              <span className="step-card-number">{i + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 28, padding: "28px 24px" }}>
          <h3>5-layer architecture</h3>
          <p className="muted" style={{ marginBottom: 18 }}>
            Traditional systems allocate by status or negotiation. WCN allocates by verified contribution.
          </p>
          <div className="tier-stack">
            {layers.map((layer, i) => (
              <div key={layer.label} className="tier-bar" style={{ width: layer.width, marginLeft: "auto", marginRight: "auto" }}>
                <span className="badge badge-accent" style={{ minWidth: 28, justifyContent: "center" }}>{i + 1}</span>
                <div>
                  <div className="tier-bar-label">{layer.label}</div>
                  <div className="tier-bar-desc">{layer.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
