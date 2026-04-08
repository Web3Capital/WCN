const nodeLayers = [
  ["Global core nodes", "Cross-region capital, top projects, and strategic infrastructure connectors."],
  ["Region nodes", "National or financial-center hubs for compliance, capital, and distribution."],
  ["City / industry nodes", "Local ecosystem operators and vertical specialists (AI, RWA, stablecoins, etc.)."],
  ["Functional nodes", "Market makers, legal, audit, branding, technical delivery."],
  ["Agent nodes", "Registered agents that execute tasks under permission and audit constraints."]
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
        <div className="grid-3">
          {nodeLayers.map(([title, description]) => (
            <div className="card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <h3>Admission, upgrade, and removal</h3>
          <ul className="list-clean">
            <li>Admission: identity + capability + resource boundary + (optional) stake/seat binding</li>
            <li>Upgrade: PoB volume, evidence quality, collaboration success rate, compliance record</li>
            <li>Removal: repeated low contribution, fake evidence, severe breach, bypassing settlement</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
