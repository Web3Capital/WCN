const principles = [
  ["Coordination over aggregation", "WCN aligns participants, not just lists them."],
  ["Verification over narrative", "Claims without evidence produce noise, not value."],
  ["Settlement over speculation", "Allocation follows contribution, not hype cycles."],
  ["Institutional accountability", "Every node carries real responsibility and stake."]
];

export default function AboutPage() {
  return (
    <main>
      <section className="section hero hero-orb">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">About WCN</span>
            <h1>Institutional operating system,<br />not another platform.</h1>
          </div>
          <div className="grid-2 card-grid-animated">
            <div className="card step-card">
              <span className="step-card-number" style={{ fontSize: 72, top: -6 }}>&#x2713;</span>
              <h3>What WCN is</h3>
              <p>
                WCN is a global coordination infrastructure designed to align capital, resources,
                execution, proof, and settlement across the Web3 and AI economy.
              </p>
            </div>
            <div className="card step-card">
              <span className="step-card-number" style={{ fontSize: 72, top: -6 }}>&#x2717;</span>
              <h3>What WCN is not</h3>
              <p>
                It is not a trading venue, not a marketplace, not a passive directory, and not a
                narrative-only token layer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2>Why now</h2>
            <p>
              AI is transforming execution. Web3 is redefining ownership. Capital is increasingly
              global and fluid. Yet coordination remains fundamentally broken. WCN is designed to be
              the missing operating layer between opportunity and delivery.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Foundation</span>
            <h2>Founding principles</h2>
          </div>
          <div className="grid-2 card-grid-animated">
            {principles.map(([title, desc], i) => (
              <div key={title} className="card step-card">
                <span className="step-card-number">{i + 1}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
