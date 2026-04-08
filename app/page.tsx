import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="hero-center">
            <span className="eyebrow">Global Institutional Orchestrator for Web3 & AI</span>
            <h1>Build the coordination layer of the decentralized economy.</h1>
            <p className="hero-lede">
              WCN turns fragmented capital, resources, and execution into a structured, verifiable,
              settleable global network.
            </p>
            <div className="cta-row">
              <Link href="/apply" className="button">Apply</Link>
              <Link href="/docs/introduction" className="button-secondary">Read the Wiki</Link>
            </div>
          </div>

          <div className="hero-panels">
            <div className="kpi">
              <strong>Node</strong>
              <span className="muted">Institutional participants with real resources</span>
            </div>
            <div className="kpi">
              <strong>PoB</strong>
              <span className="muted">Proof of Business that can be verified</span>
            </div>
            <div className="kpi">
              <strong>Settlement</strong>
              <span className="muted">Value allocation driven by contribution</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Designed for real coordination.</h2>
            <p className="muted">
              A simple structure that scales: define opportunity, verify contribution, then settle.
            </p>
          </div>

          <div className="grid-3">
            <div className="card">
              <h3>Clear primitives</h3>
              <p>Node, Deal, Task, Proof, Settlement—one vocabulary across the network.</p>
            </div>
            <div className="card">
              <h3>Verifiable work</h3>
              <p>Proof is the unit of trust. Without verification, allocation can’t be fair.</p>
            </div>
            <div className="card">
              <h3>Aligned incentives</h3>
              <p>Settlement follows contribution. Less noise, more outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-divider">
        <div className="container">
          <div className="card">
            <div className="section-head">
              <h2>The minimal business loop.</h2>
              <p className="muted">
                Every opportunity becomes a workflow. Every workflow becomes proof. Every proof
                becomes the basis of settlement.
              </p>
            </div>
            <div className="flow" style={{ marginTop: 18 }}>
              {["Node", "Deal", "Task", "Proof", "Settlement"].map((item, index) => (
                <>
                  <div className="step" key={item}>{item}</div>
                  {index < 4 && <span className="arrow" key={`${item}-arrow`}>→</span>}
                </>
              ))}
            </div>
            <div className="cta-row" style={{ marginTop: 22 }}>
              <Link href="/how-it-works" className="button-secondary">How it works</Link>
              <Link href="/nodes" className="button-secondary">Explore nodes</Link>
              <Link href="/apply" className="button">Apply as a node</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
