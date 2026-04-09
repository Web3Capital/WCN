import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Ban,
  CheckCircle2,
  ClipboardList,
  FileStack,
  Network,
  Scale,
  Search,
  ShieldCheck,
  Split,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Proof of Business (PoB) — WCN",
  description:
    "PoB is WCN’s result-first value layer: verified business loops, evidence, review, attribution, and an auditable path to settlement—not activity points.",
};

const pillars = [
  {
    title: "Result threshold",
    body: "Only verified closed loops enter the PoB ledger. Activity without a provable outcome stays outside the value layer.",
  },
  {
    title: "Attribution",
    body: "PoB distinguishes who led, who collaborated, and what actually made the result hold—not a flat “everyone participated” score.",
  },
  {
    title: "Settlement input",
    body: "Recorded PoB becomes the structured input for future allocation, fees, and governance—after evidence and auditability mature in Phase 1.",
  },
  {
    title: "Network memory",
    body: "Validated outcomes persist as durable records instead of disappearing chat logs or campaign metrics.",
  },
];

const rewarded = [
  "Fundraising loops (signed, subscribed, transferred)",
  "Market loops (measurable conversion and retention)",
  "Resource loops (service onboarding and delivery)",
  "Liquidity loops (depth, spread, stability)",
  "Asset loops (design → issuance → distribution)",
  "Agent execution loops (logged work that produces attributable results)",
];

const notRewarded = [
  "Posts, hype, and “activity for activity’s sake”",
  "Unverifiable claims without evidence packs",
  "Bot traffic, wash trading, and circular attribution",
  "Side deals that bypass system accounting and attribution",
];

const verificationSteps = [
  {
    title: "Event & outcome",
    body: "Register the closed loop with clear context: deal, task, nodes, and what “done” means for this outcome.",
    icon: <ClipboardList size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Evidence pack",
    body: "Upload structured proof—contracts, on-chain references, dashboards, emails, minutes, acceptance records.",
    icon: <FileStack size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Review queue",
    body: "Reviewers check authenticity, completeness, timeline, and attribution boundaries before a conclusion.",
    icon: <Search size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Conclusion",
    body: "Approve, request more materials, reject, or route into disputes when outcomes or credit are contested.",
    icon: <Scale size={20} strokeWidth={2} aria-hidden />,
  },
  {
    title: "Archive & ledger",
    body: "Accepted records enter the PoB ledger as durable, queryable inputs for reputation and later settlement.",
    icon: <Archive size={20} strokeWidth={2} aria-hidden />,
  },
];

const formulaFactors: { name: string; hint: string }[] = [
  { name: "Base Value", hint: "Magnitude of the verified outcome tied to the loop." },
  { name: "Business Weight", hint: "How strategically important the loop type is to the network." },
  { name: "Quality Mult", hint: "Evidence depth, confirmations, and audit readiness." },
  { name: "Time Mult", hint: "Durability and how well the outcome holds over time." },
  { name: "Risk Discount", hint: "Disputes, anomalies, and policy flags reduce effective PoB." },
];

export default function PobPage() {
  return (
    <main className="pob-page">
      <section className="section hero hero-orb">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proof of Business (PoB)</span>
            <h1>Only verified outcomes become value.</h1>
            <p className="muted hero-lede">
              PoB is WCN&apos;s <strong className="pob-strong">result-first accounting layer</strong>. It does not pay for noise.
              It recognizes business loops that can be <strong className="pob-strong">proved, attributed, and audited</strong>—so
              capital and execution align with what actually happened.
            </p>
          </div>

          <div className="pob-hero-grid card-grid-animated">
            <div className="pob-hero-copy">
              <p className="muted" style={{ fontSize: 17, lineHeight: 1.65, marginBottom: 0 }}>
                This matches the wiki definition: PoB is not loyalty points or a marketing scoreboard. It is the mechanism that
                turns real, verifiable results into objects the system can admit, record, and—over time—use as settlement input.
              </p>
              <div className="pob-hero-ctas">
                <Link href="/wiki" className="button-secondary">
                  PoB in wiki
                </Link>
                <Link href="/how-it-works" className="button-secondary">
                  How it works
                </Link>
                <Link href="/nodes" className="button-secondary">
                  Node network
                </Link>
              </div>
            </div>

            <div className="pob-pillars-panel" aria-label="PoB pillars">
              <div className="pob-pillars-head">
                <ShieldCheck size={22} className="pob-pillars-icon" aria-hidden />
                <span>What PoB enforces</span>
              </div>
              <ul className="pob-pillars-list">
                {pillars.map((p) => (
                  <li key={p.title} className="pob-pillar-item">
                    <CheckCircle2 size={18} className="pob-pillar-check" aria-hidden />
                    <div>
                      <div className="pob-pillar-title">{p.title}</div>
                      <p className="pob-pillar-body">{p.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Boundaries</span>
            <h2>Rewarded vs. rejected</h2>
            <p className="muted hero-lede">
              PoB rewards <strong className="pob-strong">closed loops</strong>, not vanity metrics. If it cannot be evidenced
              and reviewed, it does not enter the ledger.
            </p>
          </div>
          <div className="grid-2 card-grid-animated">
            <div className="card pob-dual-card pob-dual-yes">
              <div className="pob-dual-icon" aria-hidden>
                <CheckCircle2 size={24} strokeWidth={2} />
              </div>
              <h3>What is rewarded</h3>
              <ul className="pob-list">
                {rewarded.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="card pob-dual-card pob-dual-no">
              <div className="pob-dual-icon pob-dual-icon-muted" aria-hidden>
                <Ban size={24} strokeWidth={2} />
              </div>
              <h3>What is not rewarded</h3>
              <ul className="pob-list">
                {notRewarded.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Verification</span>
            <h2>From “it happened” to “system-confirmed”</h2>
            <p className="muted hero-lede">
              Aligned with the five-step path in our wiki: submission, evidence, review, conclusion, and archival—not a single
              click or social post.
            </p>
          </div>
          <div className="pob-flow card-grid-animated">
            {verificationSteps.map((step, i) => (
              <div key={step.title} className="pob-flow-card">
                <div className="pob-flow-icon">{step.icon}</div>
                <div className="pob-flow-step">Step {i + 1}</div>
                <h3 className="pob-flow-title">{step.title}</h3>
                <p className="pob-flow-body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="card pob-proof-desk card-grid-animated">
            <div className="pob-proof-desk-inner">
              <div className="pob-proof-desk-icon" aria-hidden>
                <ShieldCheck size={26} strokeWidth={2} />
              </div>
              <div>
                <span className="eyebrow" style={{ marginBottom: 10 }}>
                  Proof Desk
                </span>
                <h2 className="pob-proof-desk-title">The verification control plane</h2>
                <p className="muted pob-proof-desk-lede">
                  Proof Desk is not a passive upload folder. It is where evidence is collected, reviews are queued, disputes
                  stay visible, and final decisions are issued before anything becomes PoB.
                </p>
                <ul className="pob-proof-desk-grid">
                  <li>
                    <strong className="pob-strong">Intake</strong>
                    <span className="muted">Structured evidence packages tied to events</span>
                  </li>
                  <li>
                    <strong className="pob-strong">Review</strong>
                    <span className="muted">Queues, clarifications, and policy checks</span>
                  </li>
                  <li>
                    <strong className="pob-strong">Disputes</strong>
                    <span className="muted">Space to contest outcomes or attribution</span>
                  </li>
                  <li>
                    <strong className="pob-strong">Conclusions</strong>
                    <span className="muted">Explicit pass / more info / reject paths</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Scoring</span>
            <h2>Effective PoB composition</h2>
            <p className="muted hero-lede">
              A compact formula expresses how verified outcomes aggregate. Parameters evolve with governance; Phase 1 stresses
              evidence and auditability before token settlement.
            </p>
          </div>
          <div className="pob-formula-card card-grid-animated">
            <div className="pob-formula-row" aria-label="Effective PoB formula">
              <span className="badge badge-accent">Effective PoB</span>
              <span className="formula-op">=</span>
              {formulaFactors.map((factor, i) => (
                <span key={factor.name} style={{ display: "contents" }}>
                  <span className="formula-chip">{factor.name}</span>
                  {i < formulaFactors.length - 1 ? <span className="formula-op">×</span> : null}
                </span>
              ))}
            </div>
            <div className="pob-formula-factors">
              {formulaFactors.map((f) => (
                <div key={f.name} className="pob-formula-factor">
                  <span className="pob-formula-name">{f.name}</span>
                  <p className="pob-formula-hint">{f.hint}</p>
                </div>
              ))}
            </div>
            <p className="muted pob-formula-foot">
              Phase 1 focuses on evidence, review discipline, and ledger integrity. Token settlement and broader governance
              hooks land in Phase 2+.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="grid-2 card-grid-animated" style={{ alignItems: "stretch" }}>
            <div className="card pob-attrib-card">
              <div className="pob-attrib-icon" aria-hidden>
                <Split size={22} strokeWidth={2} />
              </div>
              <h3>Attribution matters</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Without attribution, PoB only proves that a result exists. With it, the network can see who materially advanced
                the outcome—critical for fair credit, disputes, and future allocation.
              </p>
            </div>
            <div className="card pob-attrib-card pob-attrib-muted">
              <div className="pob-attrib-icon" aria-hidden>
                <XCircle size={22} strokeWidth={2} />
              </div>
              <h3>Not a substitute for law</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                PoB is an operational and evidentiary layer inside WCN. It does not replace securities, tax, or licensing
                obligations in your jurisdiction—teams still need proper counsel and disclosures.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="pob-cta-band">
            <div className="pob-cta-copy">
              <h2 className="pob-cta-title">Build loops that survive scrutiny</h2>
              <p className="muted pob-cta-desc">
                Start from nodes and tasks, or read the full PoB chapter in the wiki for definitions, attribution, and edge
                cases.
              </p>
            </div>
            <div className="pob-cta-actions">
              <Link href="/apply" className="button">
                Apply as a Node
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/wiki" className="button-secondary">
                Open wiki
              </Link>
              <Link href="/nodes" className="button-secondary">
                <Network size={18} aria-hidden />
                Node network
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
