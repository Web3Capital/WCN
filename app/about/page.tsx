export default function AboutPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">About WCN</span>
        <h1>Institutional operating system, not another platform.</h1>
        <div className="grid-2">
          <div className="card">
            <h3>What WCN is</h3>
            <p>
              WCN is a global coordination infrastructure designed to align capital, resources,
              execution, proof, and settlement across the Web3 and AI economy.
            </p>
          </div>
          <div className="card">
            <h3>What WCN is not</h3>
            <p>
              It is not a trading venue, not a marketplace, not a passive directory, and not a
              narrative-only token layer.
            </p>
          </div>
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <h2>Why now</h2>
          <p>
            AI is transforming execution. Web3 is redefining ownership. Capital is increasingly
            global and fluid. Yet coordination remains fundamentally broken. WCN is designed to be
            the missing operating layer between opportunity and delivery.
          </p>
        </div>
      </div>
    </main>
  );
}
