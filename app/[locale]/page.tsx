import type { Metadata } from "next";
import { Network, ShieldCheck, Scale, Workflow, FileCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { WCNGlyph } from "@/components/brand/wcn-glyph";
import { LedgerSpine } from "@/components/brand/ledger-spine";
import { LedgersInMotion } from "@/components/brand/ledgers-in-motion";
import { ManifestoBlock } from "@/components/brand/manifesto-block";
import { VoltageCallout } from "@/components/brand/voltage-callout";

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

  const tickerItems = [
    { color: "var(--ledger-node)", text: "NODE-0421 · APPROVED · Singapore" },
    { color: "var(--ledger-deal)", text: "DEAL-1184 · MATCHED · $2.4M" },
    { color: "var(--ledger-settle)", text: "SETTLE-9027 · CLEARED · 14 parties" },
    { color: "var(--ledger-node)", text: "NODE-0422 · UNDER REVIEW · São Paulo" },
    { color: "var(--ledger-deal)", text: "DEAL-1185 · DRAFTED · AI infra" },
    { color: "var(--ledger-settle)", text: "SETTLE-9028 · SIGNED · proof verified" },
  ];

  const metrics: Array<{ value: string; sup?: string; label: string }> = [
    { value: "147", label: t("metricNodes") },
    { value: "12", label: t("metricRegions") },
    { value: "24.7", sup: "M", label: t("metricSettled") },
    { value: "99.3", sup: "%", label: t("metricVerified") },
  ];

  return (
    <main>
      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="hero hero-orb">
        <div className="container">
          <div className="hero-center">
            <span className="hero-glyph" aria-hidden>
              <WCNGlyph size={32} variant="ledger" />
            </span>
            <span className="eyebrow eyebrow-plain" style={{ marginBottom: 0 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--ledger-node)",
                  boxShadow: "0 0 8px color-mix(in oklab, var(--ledger-node) 60%, transparent)",
                }}
                aria-hidden
              />
              {t("eyebrow")}
            </span>
            <h1>{t("headline")}</h1>
            <p className="hero-lede">{t("lede")}</p>
            <div className="cta-row cta-centered" style={{ marginTop: "var(--space-6)", justifyContent: "center" }}>
              <Link href="/apply" className="button button-lg">
                {t("applyAsNode")}
              </Link>
              <Link href="/wiki" className="button-secondary button-lg">
                {t("readWiki")}
              </Link>
            </div>
            <div
              style={{
                marginTop: "var(--space-5)",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                color: "var(--muted-2)",
                fontSize: 12,
              }}
            >
              <LedgerSpine
                labels={{
                  node: t("nodeTitle"),
                  deal: t("stepDealLabel"),
                  settle: t("settlementTitle"),
                }}
              />
              <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>v3.0 · audit-first protocol</span>
            </div>

            {/* Proof metrics — credibility under CTAs */}
            <div className="hero-metrics" role="list">
              {metrics.map((m) => (
                <div key={m.label} className="hero-metric" role="listitem">
                  <span className="hero-metric-value tabular">
                    {m.value}
                    {m.sup && <sup>{m.sup}</sup>}
                  </span>
                  <span className="hero-metric-label">{m.label}</span>
                </div>
              ))}
            </div>

            <div className="hero-scroll-cue" aria-hidden>
              {t("scrollCue")}
            </div>
          </div>

          {/* Three-ledger prism — signature centerpiece */}
          <div className="ledger-prism">
            <article className="ledger-pillar ledger-pillar-node">
              <span className="ledger-pillar-mark">Ledger 01 · Registry</span>
              <h3 className="ledger-pillar-title">{t("nodeTitle")}</h3>
              <p className="ledger-pillar-desc">{t("nodeDesc")}</p>
            </article>
            <article className="ledger-pillar ledger-pillar-deal">
              <span className="ledger-pillar-mark">Ledger 02 · Capital</span>
              <h3 className="ledger-pillar-title">{t("pobTitle")}</h3>
              <p className="ledger-pillar-desc">{t("pobDesc")}</p>
            </article>
            <article className="ledger-pillar ledger-pillar-settle">
              <span className="ledger-pillar-mark">Ledger 03 · Settlement</span>
              <h3 className="ledger-pillar-title">{t("settlementTitle")}</h3>
              <p className="ledger-pillar-desc">{t("settlementDesc")}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ═══ Live ledger ticker ═════════════════════════════ */}
      <section aria-hidden className="ledger-ticker" style={{ marginTop: "calc(var(--space-7) * -1)" }}>
        <div className="ledger-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="ledger-ticker-item">
              <span
                className="status-dot"
                style={{
                  background: item.color,
                  boxShadow: `0 0 0 3px color-mix(in oklab, ${item.color} 16%, transparent)`,
                }}
              />
              {item.text}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ № 01 · Three Ledgers in Motion (signature) ═════ */}
      <section className="section section-ledgers-in-motion">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">{t("sectionNum01")}</span>
            <span className="eyebrow eyebrow-plain">{t("ledgersInMotionEyebrow")}</span>
            <h2 style={{ marginTop: 14 }}>{t("ledgersInMotionTitle")}</h2>
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
            <h2 style={{ marginTop: 14 }}>{t("designedTitle")}</h2>
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

      {/* ═══ № 03 · Built for institutional operators ══════ */}
      <section className="section">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">{t("sectionNum03")}</span>
            <span className="eyebrow eyebrow-plain">{t("trustedByEyebrow")}</span>
            <h2 style={{ marginTop: 14 }}>{t("trustedByTitle")}</h2>
            <p>{t("trustedByDesc")}</p>
          </div>
          <div className="grid-5">
            {[t("capitalPartners"), t("regionalHubs"), t("aiLabs"), t("legalAudit"), t("marketMakers")].map((name) => (
              <div key={name} className="logo-tile">
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Manifesto — editorial pull ════════════════════ */}
      <ManifestoBlock
        eyebrow={t("manifestoEyebrow")}
        lead={t("manifestoLead")}
        body={t("manifestoBody")}
        signature={t("manifestoSign")}
      />

      {/* ═══ № 04 · The five-step loop ═════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: "var(--space-7) var(--space-6)", background: "var(--card)", borderColor: "var(--line)" }}>
            <div className="section-head section-head-numbered">
              <span className="section-number">{t("sectionNum04")}</span>
              <span className="eyebrow">Operating Loop</span>
              <h2 style={{ marginTop: 14 }}>{t("loopTitle")}</h2>
              <p>{t("loopDesc")}</p>
            </div>
            <div className="flow flow-centered" style={{ marginTop: "var(--space-6)" }}>
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
            <div className="cta-row cta-centered" style={{ marginTop: "var(--space-6)", justifyContent: "center" }}>
              <Link href="/how-it-works" className="button-secondary">
                {t("howItWorks")}
              </Link>
              <Link href="/nodes" className="button-secondary">
                {t("exploreNodes")}
              </Link>
              <Link href="/apply" className="button">
                {t("applyAsANode")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ № 05 · From the network — testimonials ════════ */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">{t("sectionNum05")}</span>
            <span className="eyebrow eyebrow-plain">In their words</span>
            <h2 style={{ marginTop: 14 }}>{t("buildersSay")}</h2>
          </div>
          <div className="grid-3 card-grid-animated">
            <article className="card testimonial">
              <p>{t("testimonial1")}</p>
              <p className="testimonial-author">— {t("testimonial1Author")}</p>
            </article>
            <article className="card testimonial">
              <p>{t("testimonial2")}</p>
              <p className="testimonial-author">— {t("testimonial2Author")}</p>
            </article>
            <article className="card testimonial">
              <p>{t("testimonial3")}</p>
              <p className="testimonial-author">— {t("testimonial3Author")}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ═══ Voltage callout — pre-footer payoff ═══════════ */}
      <VoltageCallout
        eyebrow={t("ctaBandEyebrow")}
        title={t("ctaBandTitle")}
        desc={t("ctaBandDesc")}
        primaryLabel={t("ctaBandPrimary")}
        primaryHref="/apply"
        secondaryLabel={t("ctaBandSecondary")}
        secondaryHref="/wiki"
      />
    </main>
  );
}
