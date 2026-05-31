import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WcnIcon } from "@/components/brand/icons";
import { Link } from "@/i18n/routing";
import { MistBackground } from "@/components/brand/mist-background";
import { LedgerSpine } from "@/components/brand/ledger-spine";
import { ThreeLedgerMotif } from "@/components/brand/three-ledger";
import { ManifestoBlock } from "@/components/brand/manifesto-block";
import { VoltageCallout } from "@/components/brand/voltage-callout";
import { AnimationBudget } from "@/components/brand/animation-budget";
import { ThreeInnovations } from "@/components/brand/three-innovations";

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

  // Home loop is monochrome (ledger tri-colour is dashboard-only); only the
  // Proof step carries bronze — the verification anchor — via tone "proof".
  const steps: Array<{ icon: React.ReactNode; label: string; desc: string; tone: "node" | "deal" | "voltage" | "settle" | "proof" }> = [
    { tone: "node",     icon: <WcnIcon name="node" />,   label: t("stepNodeLabel"),       desc: t("stepNodeDesc") },
    { tone: "deal",     icon: <WcnIcon name="deal" />,   label: t("stepDealLabel"),       desc: t("stepDealDesc") },
    { tone: "voltage",  icon: <WcnIcon name="task" />,   label: t("stepTaskLabel"),       desc: t("stepTaskDesc") },
    { tone: "proof",    icon: <WcnIcon name="proof" />,  label: t("stepProofLabel"),      desc: t("stepProofDesc") },
    { tone: "settle",   icon: <WcnIcon name="settle" />, label: t("stepSettlementLabel"), desc: t("stepSettlementDesc") },
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
      <MistBackground />
      <AnimationBudget />

      {/* ═══ HERO — distilled to 5 layers ═════════════════════ */}
      <section className="hero hero-orb" data-anim-host>
        <div className="container">
          <div className="hero-center">
            <h1>
              {t.rich("headline", {
                em: (chunks) => <em>{chunks}</em>,
              })}
            </h1>
            <p className="hero-lede">{t("lede")}</p>
            <div className="cta-row cta-centered u-mt-6 u-cta-row-centered">
              <Link href="/apply" className="button button-lg">
                {t("applyAsNode")}
                <span className="button-arrow" aria-hidden>→</span>
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
          </div>
        </div>
      </section>

      {/* ═══ Architecture grade — replaces fake "trusted by" labels ═══ */}
      <section className="section-architecture-grade">
        <div className="container">
          <div className="architecture-grade-inner">
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

      {/* ═══ № 01 · Three Core Innovations (white paper §01) ═══ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("innovationsTitle")}</h2>
            <p>{t("innovationsDesc")}</p>
          </div>
          <ThreeInnovations
            items={[
              { index: t("innovation1Index"), title: t("innovation1Title"), body: t("innovation1Body"), tag: t("innovation1Tag") },
              { index: t("innovation2Index"), title: t("innovation2Title"), body: t("innovation2Body"), tag: t("innovation2Tag") },
              {
                index: t("innovation3Index"),
                title: t("innovation3Title"),
                body: t("innovation3Body"),
                tag: t("innovation3Tag"),
                authority: true,
                verifiedLabel: t("innovation3Verified"),
              },
            ]}
            caption={t("innovationsCaption")}
          />
        </div>
      </section>

      {/* ═══ № 02 · Three Ledgers in Motion (signature) ═════ */}
      <section className="section section-ledgers-in-motion" data-anim-host>
        <div className="container">
          <div className="section-head">
            <h2>{t("ledgersInMotionTitle")}</h2>
            <p>{t("ledgersInMotionDesc")}</p>
          </div>
          <figure className="ledger-figure">
            <ThreeLedgerMotif
              labels={["PROJECT", "CAPITAL", "PROOF"]}
              animated
              caption={t("ledgersInMotionCaption")}
            />
          </figure>
        </div>
      </section>

      {/* ═══ № 03 · Manifesto — editorial pull ═════════════════ */}
      <ManifestoBlock
        lead={t("manifestoLead")}
        body={t("manifestoBody")}
        signature={t("manifestoSign")}
      />

      {/* ═══ № 04 · The five-step loop ═════════════════════ */}
      <section className="section section-loop">
        <div className="container">
          <div className="section-head">
            <h2>{t("loopTitle")}</h2>
            <p>{t("loopDesc")}</p>
          </div>
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
      <VoltageCallout
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
