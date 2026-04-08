const nodeTypes = [
  ["Capital Nodes", "VCs, funds, family offices."],
  ["Project Nodes", "Founders, protocols, startups."],
  ["Media Nodes", "PR firms, communities, KOLs."],
  ["Institutional Nodes", "Governments, industrial parks, enterprises."],
  ["Talent Nodes", "Developers, operators, researchers."]
];

export default function NodesPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Node Network</span>
        <h1>Join the network that orchestrates global opportunity.</h1>
        <div className="grid-3">
          {nodeTypes.map(([title, description]) => (
            <div className="card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <h3>How nodes earn</h3>
          <p>Participate in deals → execute tasks → generate proof → receive settlement.</p>
        </div>
      </div>
    </main>
  );
}
