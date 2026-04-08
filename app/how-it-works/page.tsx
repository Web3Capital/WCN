const loop = [
  ["Resource intake", "Projects, capital, media, services, and regional connections enter through nodes."],
  ["Task structuring", "Business needs become tasks with clear owners, collaborators, and milestones."],
  ["Human + Agent execution", "Humans provide judgment and relationships; agents scale research and operations."],
  ["Evidence verification", "Contracts, logs, dashboards, and on-chain proofs are attached and reviewed."],
  ["PoB record", "Only closed loops become PoB, forming an auditable value ledger."],
  ["Settlement (Phase 2)", "PoB competes for a periodic allocation pool; governance and staking follow."]
];

export default function HowItWorksPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">How It Works</span>
        <h1>From resources to verified outcomes.</h1>
        <p className="muted" style={{ maxWidth: 900 }}>
          WCN is not “activity rewards.” It is a business loop: structure work, execute with humans + agents, verify with
          evidence, and record PoB as the basis for future settlement.
        </p>
        <div className="grid-3">
          {loop.map(([title, description]) => (
            <div className="card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <h3>5-layer architecture</h3>
          <ul className="list-clean">
            <li>Human nodes layer (resources, trust, accountability)</li>
            <li>Agent execution layer (research, matching, operations)</li>
            <li>PoB verification layer (evidence, review, risk checks)</li>
            <li>Settlement layer (Phase 2: allocation, staking, governance)</li>
            <li>Asset layer (Phase 3: on-chain identity, issuance, liquidity)</li>
          </ul>
          <p>
            Traditional systems allocate by status or negotiation. WCN allocates by verified contribution.
          </p>
        </div>
      </div>
    </main>
  );
}
