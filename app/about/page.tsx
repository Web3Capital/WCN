import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  CheckCircle2,
  Cpu,
  Globe,
  Layers,
  Network,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "WCN is a global business network: nodes organize resources, agents scale execution, PoB verifies outcomes, and settlement aligns with contribution—not hype.",
};

const pillars: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Global node network",
    body: "Operators who bring capital, projects, services, media, and regional reach—and accept responsibility for what they route into the system.",
    icon: <Globe size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "AI Agent execution",
    body: "Research, outreach, monitoring, and ops that plug into tasks under permissions and logs—not chatbots bolted on the side.",
    icon: <Bot size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Proof of Business",
    body: "Only closed, evidenced loops earn ledger presence. PoB is the gate between operations and long-term value, not an activity score.",
    icon: <BadgeCheck size={20} strokeWidth={2} aria-hidden />,
  },
];

const whatIsBullets = [
  "Coordinates projects, capital, services, distribution, and execution in one workflow—not a passive directory.",
  "Starts from business density and accountable nodes; chain identity and assets follow when the network earns them.",
  "Combines human judgment with Agent scale, with evidence and review before outcomes harden into PoB.",
];

const whatIsNotBullets = [
  "Not an L1 launched to “find use cases later”—infrastructure follows real loops.",
  "Not a points-for-posting community; noise does not enter the value layer.",
  "Not a single-purpose fund or placement shop—many loop types can qualify when verified.",
  "Not open “buy a badge” membership—nodes are reviewed responsibility seats.",
  "Not a yield or guaranteed-return token story at this stage.",
  "Not buzzword stacking—every layer answers who did the work, what was proven, and how credit is attributed.",
];

const windows: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Organization over tech vanity",
    body: "Competition shifted from “new chain, new model” to whether teams can organize capital, markets, and execution end to end.",
    icon: <Layers size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Agents need a settlement plane",
    body: "AI can execute, but without attributable tasks, evidence, and PoB, outputs never become settleable objects.",
    icon: <Cpu size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Markets want outcomes",
    body: "Capital and partners increasingly ask what actually shipped—not impressions, narratives, or vanity metrics alone.",
    icon: <Target size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Real asset rails",
    body: "RWA, stablecoins, and institutional-grade expectations make on-chain carry credible once proof exists.",
    icon: <TrendingUp size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Build the network first",
    body: "Tooling is mature enough to stand up nodes, tasks, evidence, and PoB before forcing token-led distribution.",
    icon: <Wrench size={20} strokeWidth={2} aria-hidden />,
  },
];

const structuralPillars: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Nodes are responsibility units",
    body: "Not anonymous users—parties that introduce resources, advance deals, and own scope inside the network.",
    icon: <Network size={22} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Agents are execution capacity",
    body: "Scoped automation inside tasks and audit trails, amplifying humans instead of replacing accountability.",
    icon: <Bot size={22} strokeWidth={2} aria-hidden />,
  },
  {
    title: "PoB is the value gate",
    body: "Verified outcomes become durable records and the structured input for reputation and later settlement design.",
    icon: <BadgeCheck size={22} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Settlement carries proof forward",
    body: "Phase 2+ allocation, staking, and governance extend the same contribution logic—without decoupling from evidence.",
    icon: <Scale size={22} strokeWidth={2} aria-hidden />,
  },
];

const principles: { title: string; body: string }[] = [
  {
    title: "Coordination over aggregation",
    body: "WCN aligns participants around executable loops—not another list of logos that never ships together.",
  },
  {
    title: "Verification over narrative",
    body: "Claims need evidence, review, and attribution. Without that, coordination collapses into marketing noise.",
  },
  {
    title: "Settlement over speculation",
    body: "Long-term allocation should track verified contribution curves, not whoever narrates loudest this quarter.",
  },
  {
    title: "Institutional accountability",
    body: "Every node carries real boundaries: what they route in, what they execute, and what they are willing to stand behind in PoB.",
  },
];

const measureSteps = [
  "Who introduced the opportunity",
  "Who advanced collaboration into structured work",
  "Who delivered execution—people and agents",
  "What evidence exists and who reviewed it",
  "Whether the result actually holds—not whether the thread was loud",
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="section hero hero-orb about-hero">
        <div className="container about-hero-container">
          <div className="section-head about-hero-intro">
            <span className="eyebrow about-eyebrow">About WCN</span>
            <h1 className="about-hero-title">
              Institutional operating system,
              <br />
              not another platform.
            </h1>
            <p className="muted hero-lede about-hero-lede">
              Web3 Capital Network is a <strong className="about-strong">business network layer</strong> for the Web3 and AI
              economy—where resources meet execution, outcomes meet proof, and future settlement can trace back to what
              actually happened.
            </p>
          </div>

          <div className="about-hero-grid card-grid-animated">
            <div className="about-hero-copy">
              <p className="muted about-hero-sub">
                Wiki chapter 1 frames the same idea: WCN does not start from “launch a chain and hope.” It starts from
                organizing real participants, tasks, and evidence—then lets identity, assets, and settlement attach to
                verifiable history.
              </p>
              <div className="about-hero-ctas">
                <Link href="/wiki/project-intro/1-1-wcn-是什么" className="button-secondary about-hero-link">
                  <BookOpen size={17} aria-hidden />
                  WCN 是什么（Wiki）
                </Link>
                <Link href="/wiki/project-intro/1-2-wcn-不是什么" className="button-secondary about-hero-link">
                  Boundaries（Wiki）
                </Link>
                <Link href="/how-it-works" className="button-secondary about-hero-link">
                  How it works
                </Link>
              </div>
            </div>

            <div className="about-pillars-panel glass" aria-label="Three pillars">
              <div className="about-pillars-head">
                <Sparkles size={20} className="about-pillars-icon" aria-hidden />
                <span>Three pillars</span>
              </div>
              <ul className="about-pillars-list">
                {pillars.map((p) => (
                  <li key={p.title} className="about-pillar-item">
                    <div className="about-pillar-icon">{p.icon}</div>
                    <div>
                      <div className="about-pillar-title">{p.title}</div>
                      <p className="about-pillar-body">{p.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt about-clarity">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">Definition</span>
            <h2 className="about-section-h2">What WCN is—and is not</h2>
            <p className="muted hero-lede about-section-lede">
              Aligned with project-intro and boundary chapters: say the constructive definition first, then remove the six
              recurring misconceptions before they distort everything downstream.
            </p>
          </div>
          <div className="about-split-board grid-2 card-grid-animated">
            <div className="about-split-slab about-split-slab--yes">
              <span className="about-split-watermark" aria-hidden>
                ✓
              </span>
              <div className="card about-dual-card about-dual-yes">
                <div className="about-dual-icon" aria-hidden>
                  <CheckCircle2 size={24} strokeWidth={2} />
                </div>
                <h3>What WCN is</h3>
                <p className="muted about-dual-lede">
                  A coordination infrastructure that aligns capital, resources, execution, proof, and—over time—settlement on
                  verified contribution.
                </p>
                <ul className="about-list">
                  {whatIsBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="about-split-slab about-split-slab--no">
              <span className="about-split-watermark" aria-hidden>
                ✕
              </span>
              <div className="card about-dual-card about-dual-no">
                <div className="about-dual-icon about-dual-icon-muted" aria-hidden>
                  <XCircle size={24} strokeWidth={2} />
                </div>
                <h3>What WCN is not</h3>
                <p className="muted about-dual-lede">
                  If any of these are what you are looking for, WCN will feel misaligned—and that is useful to know early.
                </p>
                <ul className="about-list">
                  {whatIsNotBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-windows">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">Why now</span>
            <h2 className="about-section-h2">Five windows opening at once</h2>
            <p className="muted hero-lede about-section-lede">
              From wiki §1.4: timing is not “because the acronym is trendy”—several structural shifts now land together, and
              WCN is built to respond to all of them.
            </p>
          </div>
          <div className="about-windows-grid card-grid-animated">
            {windows.map((w, i) => (
              <div key={w.title} className="about-window-card">
                <div className="about-window-icon">{w.icon}</div>
                <span className="about-window-index">Window {i + 1}</span>
                <h3 className="about-window-title">{w.title}</h3>
                <p className="about-window-body">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt about-structure">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">Differentiation</span>
            <h2 className="about-section-h2">Structural stack, not a feature slide</h2>
            <p className="muted hero-lede about-section-lede">
              Chapter 13.4’s point in one line: few teams wire resource organization, execution scale, proof, and long-term
              settlement into the same accountable chain—WCN does.
            </p>
          </div>
          <div className="about-struct-grid card-grid-animated">
            {structuralPillars.map((item) => (
              <div key={item.title} className="about-struct-card">
                <div className="about-struct-icon">{item.icon}</div>
                <h3 className="about-struct-title">{item.title}</h3>
                <p className="about-struct-body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-measure">
        <div className="container">
          <div className="card about-measure-card card-grid-animated">
            <div className="about-measure-inner">
              <div>
                <span className="eyebrow about-eyebrow about-measure-kicker">Minimum logic</span>
                <h2 className="about-measure-title">What we actually measure</h2>
                <p className="muted about-measure-lede">
                  Adapted from wiki §1.1: WCN cares who moved the outcome—not who was loudest in the channel.
                </p>
              </div>
              <ol className="about-measure-list">
                {measureSteps.map((step, i) => (
                  <li key={step} className="about-measure-step">
                    <span className="about-measure-num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt about-foundation">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">Foundation</span>
            <h2 className="about-section-h2">Founding principles</h2>
            <p className="muted hero-lede about-section-lede">
              Operating defaults drawn from the same judgment set as solution chapter 3—coordination, proof, settlement, and
              responsibility beat aggregation and narrative alone.
            </p>
          </div>
          <div className="grid-2 about-principles-grid card-grid-animated">
            {principles.map((row, i) => (
              <div key={row.title} className="card about-principle-card">
                <span className="about-principle-index">{i + 1}</span>
                <h3>{row.title}</h3>
                <p className="muted about-principle-body">{row.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight about-cta-section">
        <div className="container">
          <div className="about-cta-band">
            <div className="about-cta-copy">
              <h2 className="about-cta-title">Go deeper in the wiki</h2>
              <p className="muted about-cta-desc">
                Solution architecture, node system, PoB, and “why WCN” chapters unpack the same story with chapter-level
                rigor—start from intro or jump to differentiation.
              </p>
            </div>
            <div className="about-cta-actions">
              <Link href="/wiki" className="button">
                <BookOpen size={18} aria-hidden />
                Open wiki
              </Link>
              <Link href="/wiki/solution/3-1-wcn-的整体解法" className="button-secondary">
                System solution
              </Link>
              <Link href="/apply" className="button-secondary">
                Apply as a Node
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
