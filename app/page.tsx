import Link from "next/link";
import { Network, ShieldCheck, Scale, Workflow, FileCheck } from "lucide-react";

const steps = [
  { icon: <Network size={22} />, label: "Node", desc: "Institutional participants enter" },
  { icon: <Workflow size={22} />, label: "Deal", desc: "Opportunities become tasks" },
  { icon: <FileCheck size={22} />, label: "Task", desc: "Structured execution" },
  { icon: <ShieldCheck size={22} />, label: "Proof", desc: "Evidence-backed verification" },
  { icon: <Scale size={22} />, label: "Settlement", desc: "Value follows contribution" }
];

export default function HomePage() {
  return (
    <main>
      <section className="hero hero-orb">
        <div className="container">
          <div className="hero-center">
            <span className="eyebrow">Global Institutional Orchestrator for Web3 & AI</span>
            <h1>Build the coordination layer of the decentralized economy.</h1>
            <p className="hero-lede">
              WCN turns fragmented capital, resources, and execution into a structured, verifiable,
              settleable global network.
            </p>
            <div className="cta-row cta-centered">
              <Link href="/apply" className="button">Apply as a Node</Link>
              <Link href="/docs/introduction" className="button-secondary">Read the Wiki</Link>
            </div>
          </div>

          <div className="hero-panels card-grid-animated" style={{ marginTop: 36 }}>
            <div className="kpi kpi-centered">
              <div className="kpi-icon-wrap">
                <Network size={28} strokeWidth={1.5} />
              </div>
              <strong>Node</strong>
              <span className="muted">Institutional participants with real resources</span>
            </div>
            <div className="kpi kpi-centered">
              <div className="kpi-icon-wrap">
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
              <strong>PoB</strong>
              <span className="muted">Proof of Business that can be verified</span>
            </div>
            <div className="kpi kpi-centered">
              <div className="kpi-icon-wrap">
                <Scale size={28} strokeWidth={1.5} />
              </div>
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

          <div className="grid-3 card-grid-animated">
            <div className="card step-card">
              <span className="step-card-number">1</span>
              <h3>Clear primitives</h3>
              <p>Node, Deal, Task, Proof, Settlement — one vocabulary across the network.</p>
            </div>
            <div className="card step-card">
              <span className="step-card-number">2</span>
              <h3>Verifiable work</h3>
              <p>Proof is the unit of trust. Without verification, allocation can't be fair.</p>
            </div>
            <div className="card step-card">
              <span className="step-card-number">3</span>
              <h3>Aligned incentives</h3>
              <p>Settlement follows contribution. Less noise, more outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Trusted by institutions</span>
            <h2>Built for real-world coordination.</h2>
            <p className="muted">Designed for capital partners, regional operators, and execution teams across Web3 and AI.</p>
          </div>
          <div className="grid-5" style={{ opacity: 0.55 }}>
            {["Capital Partners", "Regional Hubs", "AI Labs", "Legal & Audit", "Market Makers"].map((name) => (
              <div key={name} className="logo-tile">
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-divider">
        <div className="container">
          <div className="card" style={{ padding: "32px 28px" }}>
            <div className="section-head">
              <h2>The minimal business loop.</h2>
              <p className="muted">
                Every opportunity becomes a workflow. Every workflow becomes proof. Every proof
                becomes the basis of settlement.
              </p>
            </div>
            <div className="flow flow-centered" style={{ marginTop: 24 }}>
              {steps.map((step, index) => (
                <div key={step.label} style={{ display: "contents" }}>
                  <div className="step step-vertical">
                    <span className="step-icon">{step.icon}</span>
                    <span className="step-name">{step.label}</span>
                    <span className="step-desc">{step.desc}</span>
                  </div>
                  {index < 4 && <span className="arrow" style={{ fontSize: 20, marginTop: 10 }}>→</span>}
                </div>
              ))}
            </div>
            <div className="cta-row cta-centered" style={{ marginTop: 28 }}>
              <Link href="/how-it-works" className="button-secondary">How it works</Link>
              <Link href="/nodes" className="button-secondary">Explore nodes</Link>
              <Link href="/apply" className="button">Apply as a node</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>What builders say.</h2>
          </div>
          <div className="grid-3 card-grid-animated">
            <div className="card testimonial">
              <p>&ldquo;WCN finally gives us a structured way to verify cross-border execution and settle fairly.&rdquo;</p>
              <p className="testimonial-author">— Regional Node Operator</p>
            </div>
            <div className="card testimonial">
              <p>&ldquo;The PoB model changed how we think about contribution tracking. Evidence-first is the only way.&rdquo;</p>
              <p className="testimonial-author">— Capital Partner</p>
            </div>
            <div className="card testimonial">
              <p>&ldquo;Agent execution with audit trails means our AI tools integrate cleanly into institutional workflows.&rdquo;</p>
              <p className="testimonial-author">— AI Lab Lead</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
