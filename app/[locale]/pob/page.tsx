import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
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

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pob" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

const PILLAR_KEYS = [
  { title: "pillar1Title", body: "pillar1Body" },
  { title: "pillar2Title", body: "pillar2Body" },
  { title: "pillar3Title", body: "pillar3Body" },
  { title: "pillar4Title", body: "pillar4Body" },
] as const;

const REWARDED_KEYS = [
  "rewarded1",
  "rewarded2",
  "rewarded3",
  "rewarded4",
  "rewarded5",
  "rewarded6",
] as const;

const NOT_REWARDED_KEYS = ["notRewarded1", "notRewarded2", "notRewarded3", "notRewarded4"] as const;

const VERIFICATION_STEP_DEFS = [
  {
    titleKey: "verificationStep1Title",
    bodyKey: "verificationStep1Body",
    icon: <ClipboardList size={20} strokeWidth={2} aria-hidden />,
  },
  {
    titleKey: "verificationStep2Title",
    bodyKey: "verificationStep2Body",
    icon: <FileStack size={20} strokeWidth={2} aria-hidden />,
  },
  {
    titleKey: "verificationStep3Title",
    bodyKey: "verificationStep3Body",
    icon: <Search size={20} strokeWidth={2} aria-hidden />,
  },
  {
    titleKey: "verificationStep4Title",
    bodyKey: "verificationStep4Body",
    icon: <Scale size={20} strokeWidth={2} aria-hidden />,
  },
  {
    titleKey: "verificationStep5Title",
    bodyKey: "verificationStep5Body",
    icon: <Archive size={20} strokeWidth={2} aria-hidden />,
  },
] as const;

const FORMULA_FACTOR_KEYS = [
  { name: "factorBaseValueName", hint: "factorBaseValueHint" },
  { name: "factorBusinessWeightName", hint: "factorBusinessWeightHint" },
  { name: "factorQualityMultName", hint: "factorQualityMultHint" },
  { name: "factorTimeMultName", hint: "factorTimeMultHint" },
  { name: "factorRiskDiscountName", hint: "factorRiskDiscountHint" },
] as const;

export default async function PobPage() {
  const t = await getTranslations("pob");
  const tCommon = await getTranslations("common");

  const pillars = PILLAR_KEYS.map((k) => ({
    title: t(k.title),
    body: t(k.body),
  }));

  const rewarded = REWARDED_KEYS.map((k) => t(k));
  const notRewarded = NOT_REWARDED_KEYS.map((k) => t(k));

  const verificationSteps = VERIFICATION_STEP_DEFS.map((step) => ({
    title: t(step.titleKey),
    body: t(step.bodyKey),
    icon: step.icon,
  }));

  const formulaFactors = FORMULA_FACTOR_KEYS.map((k) => ({
    name: t(k.name),
    hint: t(k.hint),
  }));

  return (
    <main className="pob-page">
      <section className="section hero hero-orb pob-hero">
        <div className="container pob-hero-container">
          <div className="section-head pob-hero-intro">
            <span className="eyebrow pob-eyebrow">{t("eyebrow")}</span>
            <h1 className="pob-hero-title">{t("headline")}</h1>
            <p className="muted hero-lede pob-hero-lede">
              {t.rich("lede", {
                strong: (chunks) => <strong className="pob-strong">{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="pob-hero-grid card-grid-animated">
            <div className="pob-hero-copy">
              <p className="muted pob-hero-sub">{t("subLede")}</p>
              <div className="pob-hero-ctas">
                <Link href="/wiki" className="button-secondary pob-hero-link">
                  {t("pobInWiki")}
                </Link>
                <Link href="/how-it-works" className="button-secondary pob-hero-link">
                  {tCommon("howItWorks")}
                </Link>
                <Link href="/nodes" className="button-secondary pob-hero-link">
                  {t("nodeNetwork")}
                </Link>
              </div>
            </div>

            <div className="pob-pillars-panel glass" aria-label={t("pillarsPanelAria")}>
              <div className="pob-pillars-head">
                <ShieldCheck size={22} className="pob-pillars-icon" aria-hidden />
                <span>{t("whatPobEnforces")}</span>
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

      <section className="section section-alt pob-boundaries">
        <div className="container">
          <div className="section-head pob-section-head">
            <span className="eyebrow pob-eyebrow">{t("boundariesEyebrow")}</span>
            <h2 className="pob-section-h2">{t("boundariesTitle")}</h2>
            <p className="muted hero-lede pob-section-lede">
              {t.rich("boundariesDesc", {
                strong: (chunks) => <strong className="pob-strong">{chunks}</strong>,
              })}
            </p>
          </div>
          <div className="pob-split-board grid-2 card-grid-animated">
            <div className="pob-split-slab pob-split-slab--yes">
              <span className="pob-split-watermark" aria-hidden>
                01
              </span>
              <div className="card pob-dual-card pob-dual-yes">
                <div className="pob-dual-icon" aria-hidden>
                  <CheckCircle2 size={24} strokeWidth={2} />
                </div>
                <h3>{t("whatIsRewarded")}</h3>
                <ul className="pob-list">
                  {rewarded.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pob-split-slab pob-split-slab--no">
              <span className="pob-split-watermark" aria-hidden>
                02
              </span>
              <div className="card pob-dual-card pob-dual-no">
                <div className="pob-dual-icon pob-dual-icon-muted" aria-hidden>
                  <Ban size={24} strokeWidth={2} />
                </div>
                <h3>{t("whatIsNotRewarded")}</h3>
                <ul className="pob-list">
                  {notRewarded.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pob-verify">
        <div className="container">
          <div className="section-head pob-section-head">
            <span className="eyebrow pob-eyebrow">{t("verificationEyebrow")}</span>
            <h2 className="pob-section-h2">{t("verificationTitle")}</h2>
            <p className="muted hero-lede pob-section-lede">{t("verificationDesc")}</p>
          </div>
          <div className="pob-flow-wrap">
            <div className="pob-flow card-grid-animated">
              {verificationSteps.map((step, i) => (
                <div key={step.title} className="pob-flow-card">
                  <div className="pob-flow-icon">{step.icon}</div>
                  <div className="pob-flow-step">{t("verificationStep", { n: i + 1 })}</div>
                  <h3 className="pob-flow-title">{step.title}</h3>
                  <p className="pob-flow-body">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt pob-proof-section">
        <div className="container">
          <div className="card pob-proof-desk card-grid-animated">
            <div className="pob-proof-desk-inner">
              <div className="pob-proof-desk-icon" aria-hidden>
                <ShieldCheck size={26} strokeWidth={2} />
              </div>
              <div>
                <span className="eyebrow pob-eyebrow pob-proof-eyebrow">{t("proofDeskEyebrow")}</span>
                <h2 className="pob-proof-desk-title">{t("proofDeskTitle")}</h2>
                <p className="muted pob-proof-desk-lede">{t("proofDeskDesc")}</p>
                <ul className="pob-proof-desk-grid">
                  <li>
                    <strong className="pob-strong">{t("intake")}</strong>
                    <span className="muted">{t("intakeDesc")}</span>
                  </li>
                  <li>
                    <strong className="pob-strong">{t("review")}</strong>
                    <span className="muted">{t("reviewDesc")}</span>
                  </li>
                  <li>
                    <strong className="pob-strong">{t("disputes")}</strong>
                    <span className="muted">{t("disputesDesc")}</span>
                  </li>
                  <li>
                    <strong className="pob-strong">{t("conclusions")}</strong>
                    <span className="muted">{t("conclusionsDesc")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pob-scoring">
        <div className="container">
          <div className="section-head pob-section-head">
            <span className="eyebrow pob-eyebrow">{t("scoringEyebrow")}</span>
            <h2 className="pob-section-h2">{t("scoringTitle")}</h2>
            <p className="muted hero-lede pob-section-lede">{t("scoringDesc")}</p>
          </div>
          <div className="card pob-formula-card card-grid-animated">
            <p className="pob-formula-label">{t("composition")}</p>
            <div className="pob-formula-specbar" aria-label={t("formulaSpecAria")}>
              <span className="pob-formula-eq">{t("effectivePob")}</span>
              <span className="pob-formula-op">=</span>
              {formulaFactors.map((factor, i) => (
                <span key={factor.name} className="pob-formula-term-wrap">
                  <span className="pob-formula-term">{factor.name}</span>
                  {i < formulaFactors.length - 1 ? <span className="pob-formula-op">×</span> : null}
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
            <p className="muted pob-formula-foot">{t("scoringFoot")}</p>
          </div>
        </div>
      </section>

      <section className="section section-alt pob-attrib-section">
        <div className="container">
          <div className="grid-2 pob-attrib-grid card-grid-animated">
            <div className="card pob-attrib-card">
              <div className="pob-attrib-icon" aria-hidden>
                <Split size={22} strokeWidth={2} />
              </div>
              <h3>{t("attributionTitle")}</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                {t("attributionBody")}
              </p>
            </div>
            <div className="card pob-attrib-card pob-attrib-muted">
              <div className="pob-attrib-icon" aria-hidden>
                <XCircle size={22} strokeWidth={2} />
              </div>
              <h3>{t("notLawTitle")}</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                {t("notLawBody")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight pob-cta-section">
        <div className="container">
          <div className="pob-cta-band">
            <div className="pob-cta-copy">
              <h2 className="pob-cta-title">{t("ctaTitle")}</h2>
              <p className="muted pob-cta-desc">{t("ctaDesc")}</p>
            </div>
            <div className="pob-cta-actions">
              <Link href="/apply" className="button">
                {tCommon("applyAsNode")}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/wiki" className="button-secondary">
                {t("openWiki")}
              </Link>
              <Link href="/nodes" className="button-secondary">
                <Network size={18} aria-hidden />
                {t("nodeNetwork")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
