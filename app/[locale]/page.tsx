import type { Metadata } from "next";
import { Network, ShieldCheck, Scale, Workflow, FileCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { WCNGlyph } from "@/components/brand/wcn-glyph";
import { LedgerSpine } from "@/components/brand/ledger-spine";
import { LedgersInMotion } from "@/components/brand/ledgers-in-motion";
import { ManifestoBlock } from "@/components/brand/manifesto-block";
import { VoltageCallout } from "@/components/brand/voltage-callout";
import { AnimationBudget } from "@/components/brand/animation-budget";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations("home");

  const steps = [
    { icon: <Network size={18} />, label: t("stepNodeLabel"), desc: t("stepNodeDesc") },
    { icon: <Workflow size={18} />, label: t("stepDealLabel"), desc: t("stepDealDesc") },
    { icon: <FileCheck size={18} />, label: t("stepTaskLabel"), desc: t("stepTaskDesc") },
    { icon: <ShieldCheck size={18} />, label: t("stepProofLabel"), desc: t("stepProofDesc") },
    { icon: <Scale size={18} />, label: t("stepSettlementLabel"), desc: t("stepSettlementDesc") },
  ];

  // Sample telemetry — clearly labeled as illustrative, not real volumes.
  const tickerItems = [
    { color: "var(--ledger-node)", text: "NODE-### · APPROVED · sample" },
    { color: "var(--ledger-deal)", text: "DEAL-### · MATCHED · sample" },
    { color: "var(--ledger-settle)", text: "SETTLE-### · CLEARED · sample" },
    { color: "var(--ledger-node)", text: "NODE-### · UNDER REVIEW · sample" },
    { color: "var(--ledger-deal)", text: "DEAL-### · DRAFTED · sample" },
    { color: "var(--ledger-settle)", text: "SETTLE-### · SIGNED · sample" },
  ];

  // Architecture grade badges — describe the protocol, not made-up volumes.
  const architectureBadges: Array<{ label: string; tone: "node" | "deal" | "settle" | "voltage" }> = [
    { label: t("architectureBadgeAuditFirst"), tone: "voltage" },
    { label: t("architectureBadgeThreeLedger"), tone: "node" },
    { label: t("architectureBadgePoB"), tone: "deal" },
    { label: t("architectureBadgeDAOReady"), tone: "settle" },
  ];
  const toneVar: Record<typeof architectureBadges[number]["tone"], string> = {
    node: "var(--ledger-node)",
    deal: "var(--ledger-deal)",
    settle: "var(--ledger-settle)",
    voltage: "var(--voltage-500)",
  };

  return (
    <main>
      <AnimationBudget />

      {/* ═══ HERO — distilled to 5 layers ═════════════════════ */}
      <section className="hero hero-orb" data-anim-host>
        <div className="container">
          <div className="hero-center">
            <span className="eyebrow eyebrow-plain">
              <span
                className="status-dot"
                style={{
                  background: "var(--ledger-node)",
                  width: 6,
                  height: 6,
                }}
                aria-hidden
              />
              {t("eyebrow")}
            </span>
            <h1>
              {t.rich("headline", {
                em: (chunks) => <em>{chunks}</em>,
              })}
            </h1>
            <p className="hero-lede">{t("lede")}</p>
            <div className="cta-row cta-centered u-mt-6 u-cta-row-centered">
              <Link href="/apply" className="button button-lg">
                {t("applyAsNode")}
              </Link>
              <Link href="/wiki" className="button-secondary button-lg">
                {t("readWiki")}
              </Link>
            </div>
            <div className="u-meta-strip">
              <LedgerSpine
                labels={{
                  node: t("nodeTitle"),
                  deal: t("stepDealLabel"),
                  settle: t("settlementTitle"),
                }}
              />
              <span className="u-meta-strip-version">v3.0 · audit-first</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Architecture grade — replaces fake "trusted by" labels ═══ */}
      <section className="section-architecture-grade">
        <div className="container">
          <div className="architecture-grade-inner">
            <span className="architecture-grade-label">{t("architectureGroupTitle")}</span>
            {architectureBadges.map((b) => (
              <span
                key={b.label}
                className="architecture-badge"
                style={{ ["--ledger-color" as string]: toneVar[b.tone] }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Sample telemetry ticker ═══════════════════════════ */}
      <div className="container" style={{ marginTop: "var(--space-5)" }}>
        <span className="ticker-honesty">{t("tickerCaption")}</span>
      </div>
      <section aria-hidden className="ledger-ticker" data-anim-host>
        <div className="ledger-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="ledger-ticker-item">
              <span
                className="status-dot"
                style={{
                  background: item.color,
                  boxShadow: `0 0 0 3px color-mix(in oklab, ${item.color} 14%, transparent)`,
                }}
              />
              {item.text}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ № 01 · Three Ledgers in Motion (signature) ═════ */}
      <section className="section section-ledgers-in-motion" data-anim-host>
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">{t("sectionNum01")}</span>
            <span className="eyebrow eyebrow-plain">{t("ledgersInMotionEyebrow")}</span>
            <h2 className="u-mt-3">{t("ledgersInMotionTitle")}</h2>
            <p>{t("ledgersInMotionDesc")}</p>
          </div>
          <LedgersInMotion caption={t("ledgersInMotionCaption")} />
        </div>
      </section>

      {/* ═══ № 02 · Three principles ═══════════════════════ */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">{t("sectionNum02")}</span>
            <span className="eyebrow">Designed for</span>
            <h2 className="u-mt-3">{t("designedTitle")}</h2>
            <p>{t("designedDesc")}</p>
          </div>

          <div className="grid-3 card-grid-animated">
            <article className="card step-card">
              <span className="step-card-number">01</span>
              <h3>{t("clearPrimitives")}</h3>
              <p>{t("clearPrimitivesDesc")}</p>
            </article>
            <article className="card step-card">
              <span className="step-card-number">02</span>
              <h3>{t("verifiableWork")}</h3>
              <p>{t("verifiableWorkDesc")}</p>
            </article>
            <article className="card step-card">
              <span className="step-card-number">03</span>
              <h3>{t("alignedIncentives")}</h3>
              <p>{t("alignedIncentivesDesc")}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ═══ № 03 · Manifesto — editorial pull ═════════════════ */}
      <ManifestoBlock
        sectionNumber={t("sectionNum03")}
        eyebrow={t("manifestoEyebrow")}
        lead={t("manifestoLead")}
        body={t("manifestoBody")}
        signature={t("manifestoSign")}
      />

      {/* ═══ № 04 · The five-step loop ═════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: "var(--space-7) var(--space-6)" }}>
            <div className="section-head section-head-numbered">
              <span className="section-number">{t("sectionNum04")}</span>
              <span className="eyebrow">Operating Loop</span>
              <h2 className="u-mt-3">{t("loopTitle")}</h2>
              <p>{t("loopDesc")}</p>
            </div>
            <div className="flow flow-centered u-mt-6">
              {steps.map((step, index) => (
                <div key={step.label} style={{ display: "contents" }}>
                  <div className="step step-vertical">
                    <span className="step-icon">{step.icon}</span>
                    <span className="step-name">{step.label}</span>
                    <span className="step-desc">{step.desc}</span>
                  </div>
                  {index < 4 && (
                    <span className="arrow" aria-hidden>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
            {/* Loop section is for LEARNING not converting — only learning links here */}
            <div className="cta-row cta-centered u-mt-6 u-cta-row-centered">
              <Link href="/how-it-works" className="button-secondary">
                {t("loopCtaLearn")}
              </Link>
              <Link href="/nodes" className="button-secondary">
                {t("loopCtaExplore")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Voltage callout — pre-footer payoff (progressive CTA) ═══ */}
      <VoltageCallout
        eyebrow={t("ctaBandEyebrow")}
        title={t("ctaBandTitle")}
        desc={t("ctaBandDesc")}
        primaryLabel={t("voltageBegin")}
        primaryHref="/apply"
        secondaryLabel={t("voltageReadProtocol")}
        secondaryHref="/wiki"
      />
    </main>
  );
}
