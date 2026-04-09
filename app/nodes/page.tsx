import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileSignature,
  GitBranch,
  Inbox,
  Network,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Node Network — WCN",
  description:
    "Nodes are WCN responsibility units: resource intake, execution, evidence, PoB, and settlement accountability—with tiered scope and a full admission lifecycle.",
};

const nodeLayers = [
  {
    tier: "Tier 1",
    label: "Global core nodes",
    desc: "Cross-region capital, flagship projects, and strategic infrastructure connectors that anchor network-wide trust and liquidity.",
    accent: "accent" as const,
  },
  {
    tier: "Tier 2",
    label: "Region nodes",
    desc: "National or financial-center hubs for compliance, capital formation, distribution, and regional deal orchestration.",
    accent: "green" as const,
  },
  {
    tier: "Tier 3",
    label: "City / industry nodes",
    desc: "Local ecosystem operators and vertical specialists—AI, RWA, stablecoins, media, and technical delivery close to the ground.",
    accent: "amber" as const,
  },
  {
    tier: "Tier 4",
    label: "Functional nodes",
    desc: "Market makers, legal, audit, brand, and engineering partners that plug in as accountable service units.",
    accent: "purple" as const,
  },
  {
    tier: "Tier 5",
    label: "Agent nodes",
    desc: "Registered agents executing scoped tasks under permission, logging, and audit—human judgment stays in the loop where required.",
    accent: "muted" as const,
  },
];

const responsibilityLoop = [
  {
    title: "Resource intake",
    body: "Projects, capital, media, services, and regional flow enter the network through declared node boundaries—not anonymous feeds.",
  },
  {
    title: "Execution ownership",
    body: "Nodes structure and own work: tasks, collaborators, milestones, and delivery risk within their scope.",
  },
  {
    title: "Evidence & PoB",
    body: "Outcomes attach verifiable artifacts; closed loops can become Proof of Business (PoB) records for review and allocation logic.",
  },
  {
    title: "Settlement accountability",
    body: "Nodes carry settlement responsibility: honoring allocation outcomes, fees, and governance where applicable—bypass is a breach, not a feature.",
  },
];

const lifecycle = [
  {
    title: "Application",
    body: "Identity, capability, jurisdiction, and resource boundaries—plus optional seat or stake alignment where the program requires it.",
    icon: <Inbox size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Review & diligence",
    body: "Verification, risk screening, and clarifications; probation or conditional admission when the network needs more signal.",
    icon: <UserCheck size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Contract & onboarding",
    body: "Agreements, billing hooks, and go-live criteria so operational status is explicit—not implied by a profile alone.",
    icon: <FileSignature size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Active operations",
    body: "Tasks, deals, evidence, and PoB under the node’s scope—with visibility rules that match role and confidentiality.",
    icon: <GitBranch size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Tier & status motion",
    body: "Upgrades from verified PoB volume, evidence quality, and collaboration; probation, suspension, or offboarding for sustained failure or severe breach.",
    icon: <ClipboardCheck size={20} strokeWidth={2} aria-hidden />,
  },
];

const governanceRows = [
  {
    badge: "badge-green",
    label: "Admission",
    text: "Identity + capability + resource boundary + optional stake/seat binding when the node class requires it.",
  },
  {
    badge: "badge-amber",
    label: "Upgrade",
    text: "PoB volume, evidence quality, collaboration success, and compliance history—tiers reflect verified contribution, not marketing claims.",
  },
  {
    badge: "badge-red",
    label: "Removal",
    text: "Repeated low contribution, fabricated evidence, severe breach, or systematic settlement bypass.",
  },
];

export default function NodesPage() {
  return (
    <main className="nodes-page">
      <section className="section hero hero-orb">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Node Network</span>
            <h1>Nodes are responsibility units—not labels.</h1>
            <p className="muted hero-lede">
              In WCN, a <strong className="nodes-strong">node</strong> is the accountable surface for intake, execution,
              evidence, and settlement. Tiers describe <strong className="nodes-strong">scope and trust</strong>, upgraded by
              verified PoB, collaboration quality, and risk history—not by vanity metrics.
            </p>
          </div>

          <div className="nodes-hero-grid card-grid-animated">
            <div className="nodes-hero-copy">
              <p className="muted" style={{ fontSize: 17, lineHeight: 1.65, marginBottom: 0 }}>
                This matches the operating loop in our product spec: structure work, execute with humans and agents, verify with
                evidence, record PoB, and align settlement to contribution. Nodes are where that loop lands in the real economy.
              </p>
              <div className="nodes-hero-ctas">
                <Link href="/apply" className="button">
                  Apply as a Node
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link href="/how-it-works" className="button-secondary">
                  How it works
                </Link>
              </div>
            </div>

            <div className="nodes-loop-panel" aria-label="Node responsibility loop">
              <div className="nodes-loop-head">
                <Network size={22} className="nodes-loop-icon" aria-hidden />
                <span>Responsibility loop</span>
              </div>
              <ol className="nodes-loop-list">
                {responsibilityLoop.map((step, i) => (
                  <li key={step.title} className="nodes-loop-item">
                    <span className="nodes-loop-index" aria-hidden>
                      {i + 1}
                    </span>
                    <div>
                      <div className="nodes-loop-title">{step.title}</div>
                      <p className="nodes-loop-body">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Clarity</span>
            <h2>What nodes are—and are not</h2>
          </div>
          <div className="grid-2 card-grid-animated">
            <div className="card nodes-dual-card nodes-dual-yes">
              <div className="nodes-dual-icon" aria-hidden>
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <h3>Nodes are</h3>
              <ul className="nodes-list">
                <li>Accountable routing points for capital, projects, and services</li>
                <li>Owners of execution risk inside their declared territory</li>
                <li>Parties to evidence, review, and PoB where outcomes are claimed</li>
                <li>Participants in settlement and fee logic tied to real contribution</li>
              </ul>
            </div>
            <div className="card nodes-dual-card nodes-dual-no">
              <div className="nodes-dual-icon nodes-dual-icon-muted" aria-hidden>
                <XCircle size={24} strokeWidth={2} />
              </div>
              <h3>Nodes are not</h3>
              <ul className="nodes-list">
                <li>Passive directory listings or unverified “partner” badges</li>
                <li>Anonymous coordination channels without identity and boundaries</li>
                <li>Short-term campaign shells with no ongoing settlement role</li>
                <li>Substitutes for legal, tax, or regulatory obligations in your jurisdiction</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Hierarchy</span>
            <h2>Five tiers of scope</h2>
            <p className="muted hero-lede">
              Tiers are not hype bands. They express how much of the network a node is trusted to carry—from global anchors to
              scoped agent execution.
            </p>
          </div>
          <div className="nodes-tier-bento card-grid-animated">
            {nodeLayers.map((layer) => (
              <article
                key={layer.label}
                className={`nodes-tier-card nodes-tier-card--${layer.accent}`}
              >
                <span className={`nodes-tier-badge nodes-tier-badge--${layer.accent}`}>{layer.tier}</span>
                <h3 className="nodes-tier-title">{layer.label}</h3>
                <p className="nodes-tier-desc">{layer.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Lifecycle</span>
            <h2>From application to active status</h2>
            <p className="muted hero-lede">
              Aligned with the node console lifecycle in our implementation roadmap: application, review, contract and
              onboarding, operations, and ongoing tier or status changes.
            </p>
          </div>
          <div className="nodes-lifecycle card-grid-animated">
            {lifecycle.map((step, i) => (
              <div key={step.title} className="nodes-lifecycle-card">
                <div className="nodes-lifecycle-inner">
                  <div className="nodes-lifecycle-icon">{step.icon}</div>
                  <div className="nodes-lifecycle-step">Step {i + 1}</div>
                  <h3 className="nodes-lifecycle-title">{step.title}</h3>
                  <p className="nodes-lifecycle-body">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Governance</span>
            <h2>Admission, upgrade, and removal</h2>
          </div>
          <div className="grid-3 card-grid-animated">
            {governanceRows.map((row) => (
              <div key={row.label} className="card nodes-gov-card">
                <span className={`badge ${row.badge}`}>{row.label}</span>
                <p className="nodes-gov-text">{row.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight section-alt">
        <div className="container">
          <div className="nodes-cta-band">
            <div className="nodes-cta-copy">
              <h2 className="nodes-cta-title">Ready to operate as a node?</h2>
              <p className="muted nodes-cta-desc">
                Submit an application, or read the wiki for deeper architecture, PoB, and settlement context.
              </p>
            </div>
            <div className="nodes-cta-actions">
              <Link href="/apply" className="button">
                Apply as a Node
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/wiki" className="button-secondary">
                Open wiki
              </Link>
              <Link href="/pob" className="button-secondary">
                Proof of Business
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
