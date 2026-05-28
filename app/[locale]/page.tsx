import type { Metadata } from "next";
import { Network, ShieldCheck, Scale, Workflow, FileCheck } from "lucide-react";

// Phase 2 / ADR-MR-001: marketing page is statically generated for all 10
// locales (see generateStaticParams in [locale]/layout.tsx) and revalidated
// once per day. See docs/marketing-redesign.md.
export const dynamic = "force-static";
export const revalidate = 86400;
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { WCNGlyph } from "@/components/brand/wcn-glyph";
import { LedgerSpine } from "@/components/brand/ledger-spine";
import { LedgersInMotion } from "@/components/brand/ledgers-in-motion";
import { ManifestoBlock } from "@/components/brand/manifesto-block";
import { VoltageCallout } from "@/components/brand/voltage-callout";
import { AnimationBudget } from "@/components/brand/animation-budget";
import { PageMasthead } from "@/components/marketing/page-masthead";
import { SectionHead } from "@/components/marketing/section-head";

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
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");

  const steps: Array<{ icon: React.ReactNode; label: string; desc: string; tone: "node" | "deal" | "voltage" | "settle" }> = [
    { tone: "node",     icon: <Network     size={18} strokeWidth={1.5} />, label: t("stepNodeLabel"),       desc: t("stepNodeDesc") },
    { tone: "deal",     icon: <Workflow    size={18} strokeWidth={1.5} />, label: t("stepDealLabel"),       desc: t("stepDealDesc") },
    { tone: "voltage",  icon: <FileCheck   size={18} strokeWidth={1.5} />, label: t("stepTaskLabel"),       desc: t("stepTaskDesc") },
    { tone: "deal",     icon: <ShieldCheck size={18} strokeWidth={1.5} />, label: t("stepProofLabel"),      desc: t("stepProofDesc") },
    { tone: "settle",   icon: <Scale       size={18} strokeWidth={1.5} />, label: t("stepSettlementLabel"), desc: t("stepSettlementDesc") },
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
            <PageMasthead
              issueNumber="№ 01"
              section={t("mastheadSection")}
              volumeIssue={tCommon("editorial.volumeIssue")}
            />
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
            <div className="hero-meta-spine">
              <LedgerSpine
                labels={{
                  node: t("nodeTitle"),
                  deal: t("stepDealLabel"),
                  settle: t("settlementTitle"),
                }}
              />
            </div>
            <div className="hero-meta-version">v3.0 · audit-first</div>
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
          <SectionHead
            number={t("sectionNum01")}
            eyebrow={t("ledgersInMotionEyebrow")}
            title={t("ledgersInMotionTitle")}
            lede={t("ledgersInMotionDesc")}
          />
          <LedgersInMotion caption={t("ledgersInMotionCaption")} />
        </div>
      </section>

      {/* ═══ № 02 · Three principles ═══════════════════════ */}
      <section className="section section-alt">
        <div className="container">
          <SectionHead
            number={t("sectionNum02")}
            eyebrow={tCommon("editorial.designedFor")}
            title={t("designedTitle")}
            lede={t("designedDesc")}
          />

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
      <section className="section section-loop">
        <div className="container">
          <SectionHead
            number={t("sectionNum04")}
            eyebrow={tCommon("editorial.operatingLoop")}
            title={t("loopTitle")}
            lede={t("loopDesc")}
          />
          <div className="flow flow-centered loop-flow u-mt-6">
            {steps.map((step, index) => (
              <div key={step.label} style={{ display: "contents" }}>
                <div className={`step step-vertical step-tone-${step.tone}`}>
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
      </section>

      {/* ═══ Voltage callout — pre-footer payoff (progressive CTA) ═══ */}
      {/* Phase 5: progressive funnel. From /, push readers to learn how the
          system works rather than asking them to apply on first contact. */}
      <VoltageCallout
        eyebrow={t("ctaBandEyebrow")}
        title={t("ctaBandTitle")}
        desc={t("ctaBandDesc")}
        primaryLabel={tNav("howItWorks")}
        primaryHref="/how-it-works"
        secondaryLabel={tNav("about")}
        secondaryHref="/about"
      />
    </main>
  );
}
