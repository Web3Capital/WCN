const nodeLayers = [
  { tier: "Tier 1", label: "Global core nodes", desc: "Cross-region capital, top projects, and strategic infrastructure connectors." },
  { tier: "Tier 2", label: "Region nodes", desc: "National or financial-center hubs for compliance, capital, and distribution." },
  { tier: "Tier 3", label: "City / industry nodes", desc: "Local ecosystem operators and vertical specialists (AI, RWA, stablecoins, etc.)." },
  { tier: "Tier 4", label: "Functional nodes", desc: "Market makers, legal, audit, branding, technical delivery." },
  { tier: "Tier 5", label: "Agent nodes", desc: "Registered agents that execute tasks under permission and audit constraints." }
];

export default function NodesPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Node Network</span>
        <h1>Nodes are responsibility units, not labels.</h1>
        <p className="muted" style={{ maxWidth: 900 }}>
          A node is accountable for resource intake, execution, evidence, and settlement responsibility. Levels evolve by
          verified PoB, collaboration quality, and risk history.
        </p>

        <div className="card" style={{ marginTop: 24, padding: "28px 24px" }}>
          <h3>Node hierarchy</h3>
          <div className="tier-stack" style={{ marginTop: 14 }}>
            {nodeLayers.map((layer) => (
              <div key={layer.label} className="tier-bar">
                <span className="badge badge-accent">{layer.tier}</span>
                <div>
                  <div className="tier-bar-label">{layer.label}</div>
                  <div className="tier-bar-desc">{layer.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h3>Admission, upgrade, and removal</h3>
          <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span className="badge badge-green">Admission</span>
              <p style={{ margin: 0, flex: 1 }}>Identity + capability + resource boundary + (optional) stake/seat binding</p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span className="badge badge-amber">Upgrade</span>
              <p style={{ margin: 0, flex: 1 }}>PoB volume, evidence quality, collaboration success rate, compliance record</p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span className="badge badge-red">Removal</span>
              <p style={{ margin: 0, flex: 1 }}>Repeated low contribution, fake evidence, severe breach, bypassing settlement</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
