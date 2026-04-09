import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Layers,
  ListTodo,
  Network,
  Scale,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "WCN’s business loop: resources enter through nodes, work is structured and executed with humans and agents, evidence is verified, PoB records outcomes, and settlement aligns with contribution.",
};

const loopSteps: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Resource intake",
    body: "Projects, capital, media, services, and regional relationships route through accountable nodes—not anonymous feeds.",
    icon: <Network size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Task structuring",
    body: "Needs become tasks with owners, collaborators, milestones, and explicit definitions of done.",
    icon: <ListTodo size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Human + Agent execution",
    body: "People carry judgment, trust, and negotiation; agents scale research, drafting, and operations under permission and logging.",
    icon: <Bot size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Evidence verification",
    body: "Contracts, logs, dashboards, and on-chain references attach to outcomes and pass review before claims harden.",
    icon: <ShieldCheck size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "PoB record",
    body: "Only closed, verifiable loops become Proof of Business—an auditable ledger input, not a popularity score.",
    icon: <BadgeCheck size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Settlement (Phase 2)",
    body: "Verified PoB competes for periodic allocation; governance and staking extend the same contribution logic.",
    icon: <Scale size={20} strokeWidth={2} aria-hidden />,
  },
];

const layers: {
  n: number;
  label: string;
  desc: string;
  detail: string;
  widthPct: number;
  accent: "accent" | "purple" | "amber" | "green" | "muted";
}[] = [
  {
    n: 1,
    label: "Human nodes layer",
    desc: "Resources, trust, accountability",
    detail: "Where capital, deals, and services enter with a named responsible party.",
    widthPct: 100,
    accent: "accent",
  },
  {
    n: 2,
    label: "Agent execution layer",
    desc: "Research, matching, operations",
    detail: "Scoped automation that must remain attributable and auditable.",
    widthPct: 88,
    accent: "purple",
  },
  {
    n: 3,
    label: "PoB verification layer",
    desc: "Evidence, review, risk checks",
    detail: "Proof Desk and policies decide what the system is allowed to remember.",
    widthPct: 76,
    accent: "amber",
  },
  {
    n: 4,
    label: "Settlement layer",
    desc: "Allocation, staking, governance",
    detail: "Phase 2+ mechanics tie distribution to verified contribution curves.",
    widthPct: 64,
    accent: "green",
  },
  {
    n: 5,
    label: "Asset layer",
    desc: "On-chain identity, issuance, liquidity",
    detail: "Long-term instruments and liquidity sit on verified history—not raw hype.",
    widthPct: 52,
    accent: "muted",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="hiw-page">
      <section className="section hero hero-orb hiw-hero">
        <div className="container hiw-hero-container">
          <div className="section-head hiw-hero-intro">
            <span className="eyebrow hiw-eyebrow">How It Works</span>
            <h1 className="hiw-hero-title">From resources to verified outcomes.</h1>
            <p className="muted hero-lede hiw-hero-lede">
              WCN is not &ldquo;activity rewards.&rdquo; It is a <strong className="hiw-strong">business loop</strong>: structure
              work, execute with humans and agents, verify with evidence, and record{" "}
              <strong className="hiw-strong">PoB</strong> as the basis for future settlement—so allocation follows contribution,
              not narrative alone.
            </p>
          </div>

          <div className="hiw-hero-grid card-grid-animated">
            <div className="hiw-hero-copy">
              <p className="muted hiw-hero-sub">
                Every step below is reflected in the product: nodes scope intake, tasks and deals carry execution, Proof Desk
                handles evidence, and PoB is the bridge from operations to long-term value and settlement design.
              </p>
              <div className="hiw-hero-ctas">
                <Link href="/nodes" className="button-secondary hiw-hero-link">
                  Node network
                </Link>
                <Link href="/pob" className="button-secondary hiw-hero-link">
                  Proof of Business
                </Link>
                <Link href="/wiki" className="button-secondary hiw-hero-link">
                  Wiki
                </Link>
              </div>
            </div>

            <div className="hiw-glance-panel glass" aria-label="Six-step loop overview">
              <div className="hiw-glance-head">
                <Layers size={20} className="hiw-glance-icon" aria-hidden />
                <span>The loop at a glance</span>
              </div>
              <ol className="hiw-glance-list">
                {loopSteps.map((step, i) => (
                  <li key={step.title} className="hiw-glance-item">
                    <span className="hiw-glance-index">{i + 1}</span>
                    <span className="hiw-glance-title">{step.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt hiw-loop-section">
        <div className="container">
          <div className="section-head hiw-section-head">
            <span className="eyebrow hiw-eyebrow">Operating loop</span>
            <h2 className="hiw-section-h2">Six steps, one accountable chain</h2>
            <p className="muted hero-lede hiw-section-lede">
              Skipping any step collapses the system into noise. WCN is built so closed loops are visible, reviewable, and
              attributable end to end.
            </p>
          </div>
          <div className="hiw-loop-wrap">
            <div className="hiw-loop card-grid-animated">
              {loopSteps.map((step, i) => (
                <div key={step.title} className="hiw-loop-card">
                  <div className="hiw-loop-icon">{step.icon}</div>
                  <div className="hiw-loop-step">Step {i + 1}</div>
                  <h3 className="hiw-loop-title">{step.title}</h3>
                  <p className="hiw-loop-body">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section hiw-layers-section">
        <div className="container">
          <div className="section-head hiw-section-head">
            <span className="eyebrow hiw-eyebrow">Architecture</span>
            <h2 className="hiw-section-h2">Five layers, narrowest at the base</h2>
            <p className="muted hero-lede hiw-section-lede">
              Traditional systems allocate by status or negotiation. WCN compresses trust into verified contribution—the stack
              is widest where humans and agents touch reality, and tightest where assets and settlement must not drift from
              proof.
            </p>
          </div>
          <div className="hiw-layers-stack card-grid-animated">
            {layers.map((layer) => (
              <div
                key={layer.label}
                className={`hiw-layer-shell hiw-layer-shell--${layer.accent}`}
                style={{ "--hiw-layer-w": `${layer.widthPct}%` } as CSSProperties}
              >
                <div className="hiw-layer-inner">
                  <span className={`hiw-layer-badge hiw-layer-badge--${layer.accent}`}>{layer.n}</span>
                  <div className="hiw-layer-text">
                    <div className="hiw-layer-label">{layer.label}</div>
                    <div className="hiw-layer-desc">{layer.desc}</div>
                    <p className="hiw-layer-detail muted">{layer.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt hiw-bridge-section">
        <div className="container">
          <div className="grid-2 hiw-bridge-grid card-grid-animated">
            <div className="card hiw-bridge-card hiw-bridge-card--nodes">
              <span className="hiw-bridge-kicker">Entry</span>
              <h3>Nodes route reality</h3>
              <p className="muted hiw-bridge-body">
                Intake without a responsible node is just content. Nodes declare boundaries so tasks, evidence, and PoB can be
                traced to accountable operators.
              </p>
              <Link href="/nodes" className="hiw-bridge-link">
                Explore the node model
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="card hiw-bridge-card hiw-bridge-card--pob">
              <span className="hiw-bridge-kicker">Proof</span>
              <h3>PoB gates the value layer</h3>
              <p className="muted hiw-bridge-body">
                Outcomes earn a ledger presence only after evidence and review. That is what keeps settlement and reputation from
                decoupling from what actually happened.
              </p>
              <Link href="/pob" className="hiw-bridge-link">
                Read the PoB page
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight hiw-cta-section">
        <div className="container">
          <div className="hiw-cta-band">
            <div className="hiw-cta-copy">
              <h2 className="hiw-cta-title">Operate inside the loop</h2>
              <p className="muted hiw-cta-desc">
                Apply as a node, or open the wiki for chapter-deep walkthroughs of tasks, agents, PoB, and governance.
              </p>
            </div>
            <div className="hiw-cta-actions">
              <Link href="/apply" className="button">
                Apply as a Node
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/wiki" className="button-secondary">
                Open wiki
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
