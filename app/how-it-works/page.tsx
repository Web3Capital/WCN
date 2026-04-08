const steps = [
  ["Node", "Real participants with resources, capabilities, and permissions."],
  ["Deal", "Structured opportunities inside the network."],
  ["Task", "Actionable units derived from a deal."],
  ["Proof", "Verification of what was done, by whom, and with what result."],
  ["Settlement", "Allocation of value based on verified contribution."]
];

export default function HowItWorksPage() {
  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">How It Works</span>
        <h1>Intent becomes outcome through a structured business loop.</h1>
        <div className="grid-3">
          {steps.map(([title, description]) => (
            <div className="card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <h3>System logic</h3>
          <p>Resource → Execution → Proof → Value</p>
          <p>
            Traditional systems allocate by status or negotiation. WCN allocates by verified
            contribution.
          </p>
        </div>
      </div>
    </main>
  );
}
