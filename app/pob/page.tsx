export default function PobPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Proof of Business (PoB)</span>
        <h1>Only verified outcomes become value.</h1>
        <p className="muted" style={{ maxWidth: 860 }}>
          PoB is WCN’s result-first value accounting layer. It does not reward surface activity. It rewards business loops
          that can be validated by evidence, confirmation, and audit trails.
        </p>

        <div className="grid-3" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>What is rewarded</h3>
            <ul className="list-clean">
              <li>Fundraising loops (signed, subscribed, transferred)</li>
              <li>Market loops (measurable conversion and retention)</li>
              <li>Resource loops (service onboarding and delivery)</li>
              <li>Liquidity loops (depth, spread, stability)</li>
              <li>Asset loops (design → issuance → distribution)</li>
              <li>Agent execution loops (logged work that produces real results)</li>
            </ul>
          </div>
          <div className="card">
            <h3>What is not rewarded</h3>
            <ul className="list-clean">
              <li>Posts, hype, and “activity for activity’s sake”</li>
              <li>Unverifiable claims without evidence</li>
              <li>Bot traffic, wash trading, and circular attribution</li>
              <li>Side deals that bypass the system’s accounting</li>
            </ul>
          </div>
          <div className="card">
            <h3>Verification flow</h3>
            <ul className="list-clean">
              <li>Submit a structured task outcome</li>
              <li>Attach evidence (contracts, logs, on-chain tx)</li>
              <li>Multi-party confirmation</li>
              <li>Risk checks and anomaly review</li>
              <li>PoB recorded and queued for settlement (Phase 2)</li>
            </ul>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3>Suggested scoring logic (Phase 1)</h3>
          <p className="muted">
            Effective PoB = base value × business weight × quality multiplier × time multiplier × risk discount
          </p>
          <p className="muted">
            Phase 1 focuses on evidence and auditability first; token settlement and governance are Phase 2+.
          </p>
        </div>
      </div>
    </main>
  );
}

