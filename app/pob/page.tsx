import { ShieldCheck, FileCheck, Scale, Search, CheckCircle } from "lucide-react";

const flowSteps = [
  { icon: <FileCheck size={20} />, label: "Submit outcome" },
  { icon: <Search size={20} />, label: "Attach evidence" },
  { icon: <CheckCircle size={20} />, label: "Multi-party confirm" },
  { icon: <ShieldCheck size={20} />, label: "Risk review" },
  { icon: <Scale size={20} />, label: "PoB recorded" }
];

export default function PobPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Proof of Business (PoB)</span>
        <h1>Only verified outcomes become value.</h1>
        <p className="muted" style={{ maxWidth: 860 }}>
          PoB is WCN's result-first value accounting layer. It does not reward surface activity. It rewards business loops
          that can be validated by evidence, confirmation, and audit trails.
        </p>

        <div className="grid-3 card-grid-animated" style={{ marginTop: 18 }}>
          <div className="card step-card">
            <span className="step-card-number" style={{ color: "color-mix(in oklab, var(--green) 15%, transparent)" }}>&#x2713;</span>
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
          <div className="card step-card">
            <span className="step-card-number" style={{ color: "color-mix(in oklab, var(--red) 15%, transparent)" }}>&#x2717;</span>
            <h3>What is not rewarded</h3>
            <ul className="list-clean">
              <li>Posts, hype, and "activity for activity's sake"</li>
              <li>Unverifiable claims without evidence</li>
              <li>Bot traffic, wash trading, and circular attribution</li>
              <li>Side deals that bypass the system's accounting</li>
            </ul>
          </div>
          <div className="card">
            <h3>Verification flow</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {flowSteps.map((step, i) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="badge badge-accent" style={{ minWidth: 28, justifyContent: "center" }}>{i + 1}</span>
                  <span style={{ color: "var(--accent)", display: "flex" }}>{step.icon}</span>
                  <span style={{ fontSize: 14 }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20, padding: "24px" }}>
          <h3>Scoring formula</h3>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span className="badge badge-accent">Effective PoB</span>
            <span style={{ fontSize: 18, fontWeight: 300 }}>=</span>
            {["Base Value", "Business Weight", "Quality Mult", "Time Mult", "Risk Discount"].map((factor, i) => (
              <span key={factor} style={{ display: "contents" }}>
                <span style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--line)", background: "color-mix(in oklab, var(--bg-soft) 84%, transparent)", fontSize: 14, fontWeight: 600 }}>
                  {factor}
                </span>
                {i < 4 && <span style={{ fontSize: 18, fontWeight: 300, color: "var(--muted)" }}>×</span>}
              </span>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
            Phase 1 focuses on evidence and auditability first; token settlement and governance are Phase 2+.
          </p>
        </div>
      </div>
    </main>
  );
}
