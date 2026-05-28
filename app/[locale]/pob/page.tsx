import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

// Phase 2 / ADR-MR-001: static marketing page, revalidate daily.
export const dynamic = "force-static";
export const revalidate = 86400;

import {
  Archive,
  Ban,
  CheckCircle2,
  ClipboardList,
  FileStack,
  Scale,
  Search,
  ShieldCheck,
  Split,
  XCircle,
} from "lucide-react";
import { VoltageCallout } from "@/components/brand/voltage-callout";
import { PageMasthead } from "@/components/marketing/page-masthead";
import { DualSlab } from "@/components/marketing/dual-slab";
import { SectionHead } from "@/components/marketing/section-head";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

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
      {/* ═══ HERO — editorial masthead bar + centered Fraunces title ═══ */}
      <section className="section hero hero-orb pob-hero">
        <div className="container pob-hero-container">
          <PageMasthead
            issueNumber="№ 05"
            section={t("eyebrow")}
            volumeIssue={tCommon("editorial.volumeIssue")}
          />
          <div className="section-head pob-hero-intro">
            <h1 className="pob-hero-title">
              {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
            </h1>
            <p className="muted hero-lede pob-hero-lede">
              {t.rich("lede", {
                strong: (chunks) => <strong className="pob-strong">{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="pob-hero-grid card-grid-animated">
            <div className="pob-hero-copy">
              <span className="pob-editor-kicker">{tCommon("editorial.editorsNote")}</span>
              <p className="pob-hero-sub pob-hero-sub--dropcap">{t("subLede")}</p>
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

            <aside className="pob-pillars-panel glass" aria-label={t("pillarsPanelAria")}>
              <div className="pob-pillars-head">
                <ShieldCheck size={22} className="pob-pillars-icon" aria-hidden />
                <span>{t("whatPobEnforces")}</span>
              </div>
              <ol className="pob-pillars-list">
                {pillars.map((p, i) => (
                  <li key={p.title} className="pob-pillar-item">
                    <span className="pob-pillar-index" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <span className="pob-pillar-dot" aria-hidden />
                    <div className="pob-pillar-text">
                      <div className="pob-pillar-title">{p.title}</div>
                      <p className="pob-pillar-body">{p.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ № 01 — Boundaries: rewarded / not rewarded ════════════ */}
      <section className="section section-alt pob-boundaries">
        <div className="container">
          <SectionHead
            number="№ 01"
            eyebrow={t("boundariesEyebrow")}
            title={t("boundariesTitle")}
            lede={t.rich("boundariesDesc", {
              strong: (chunks) => <strong className="pob-strong">{chunks}</strong>,
            })}
          />
          <DualSlab
            affirm={{
              kicker: tCommon("editorial.rewarded"),
              title: t("whatIsRewarded"),
              items: rewarded,
            }}
            deny={{
              kicker: tCommon("editorial.notRewarded"),
              title: t("whatIsNotRewarded"),
              items: notRewarded,
            }}
          />
        </div>
      </section>

      {/* ═══ № 02 — Verification flow as editorial row sequence ══════ */}
      <section className="section pob-verify">
        <div className="container">
          <SectionHead
            number="№ 02"
            eyebrow={t("verificationEyebrow")}
            title={t("verificationTitle")}
            lede={t("verificationDesc")}
          />
          <ol className="pob-verify-editorial card-grid-animated">
            {verificationSteps.map((step, i) => (
              <li key={step.title} className="pob-verify-row">
                <span className="pob-verify-num" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pob-verify-content">
                  <div className="pob-verify-head">
                    <span className="pob-verify-icon" aria-hidden>{step.icon}</span>
                    <h3 className="pob-verify-title">{step.title}</h3>
                  </div>
                  <p className="pob-verify-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ № 03 — Proof Desk as feature article ═════════════════════ */}
      <section className="section section-alt pob-proof-section">
        <div className="container">
          <div className="pob-proof-feature card-grid-animated">
            <div className="pob-proof-head">
              <span className="section-number pob-proof-section-number">№ 03</span>
              <span className="eyebrow pob-proof-eyebrow">{t("proofDeskEyebrow")}</span>
              <h2 className="pob-proof-title">{t("proofDeskTitle")}</h2>
              <p className="pob-proof-lede">{t("proofDeskDesc")}</p>
            </div>
            <ol className="pob-proof-roles">
              <li className="pob-proof-role">
                <span className="pob-proof-role-num" aria-hidden>·a</span>
                <div className="pob-proof-role-body">
                  <div className="pob-proof-role-name">{t("intake")}</div>
                  <p className="pob-proof-role-desc">{t("intakeDesc")}</p>
                </div>
              </li>
              <li className="pob-proof-role">
                <span className="pob-proof-role-num" aria-hidden>·b</span>
                <div className="pob-proof-role-body">
                  <div className="pob-proof-role-name">{t("review")}</div>
                  <p className="pob-proof-role-desc">{t("reviewDesc")}</p>
                </div>
              </li>
              <li className="pob-proof-role">
                <span className="pob-proof-role-num" aria-hidden>·c</span>
                <div className="pob-proof-role-body">
                  <div className="pob-proof-role-name">{t("disputes")}</div>
                  <p className="pob-proof-role-desc">{t("disputesDesc")}</p>
                </div>
              </li>
              <li className="pob-proof-role">
                <span className="pob-proof-role-num" aria-hidden>·d</span>
                <div className="pob-proof-role-body">
                  <div className="pob-proof-role-name">{t("conclusions")}</div>
                  <p className="pob-proof-role-desc">{t("conclusionsDesc")}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* ═══ № 04 — Scoring formula as editorial specimen ═══════════ */}
      <section className="section pob-scoring">
        <div className="container">
          <SectionHead
            number="№ 04"
            eyebrow={t("scoringEyebrow")}
            title={t("scoringTitle")}
            lede={t("scoringDesc")}
          />
          <div className="pob-formula-feature card-grid-animated">
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
            <ol className="pob-formula-factors">
              {formulaFactors.map((f, i) => (
                <li key={f.name} className="pob-formula-factor">
                  <span className="pob-formula-factor-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <div className="pob-formula-factor-body">
                    <span className="pob-formula-name">{f.name}</span>
                    <p className="pob-formula-hint">{f.hint}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="pob-formula-foot">{t("scoringFoot")}</p>
          </div>
        </div>
      </section>

      {/* ═══ Attribution / boundary statement — editorial entries ══ */}
      <section className="section section-alt pob-attrib-section">
        <div className="container">
          <div className="grid-2 pob-attrib-grid card-grid-animated">
            <article className="card pob-attrib-card">
              <div className="pob-attrib-kicker">
                <span className="pob-attrib-kicker-num">№ 05·a</span>
                <span className="pob-attrib-kicker-rule" aria-hidden />
                <span className="pob-attrib-kicker-label">{tCommon("editorial.attribution")}</span>
              </div>
              <div className="pob-attrib-head">
                <Split size={22} strokeWidth={1.75} className="pob-attrib-icon-svg" aria-hidden />
                <h3 className="pob-attrib-title">{t("attributionTitle")}</h3>
              </div>
              <p className="pob-attrib-body">{t("attributionBody")}</p>
            </article>
            <article className="card pob-attrib-card pob-attrib-muted">
              <div className="pob-attrib-kicker">
                <span className="pob-attrib-kicker-num pob-attrib-kicker-num--muted">№ 05·b</span>
                <span className="pob-attrib-kicker-rule" aria-hidden />
                <span className="pob-attrib-kicker-label">{tCommon("editorial.boundary")}</span>
              </div>
              <div className="pob-attrib-head">
                <XCircle size={22} strokeWidth={1.75} className="pob-attrib-icon-svg pob-attrib-icon-svg--muted" aria-hidden />
                <h3 className="pob-attrib-title">{t("notLawTitle")}</h3>
              </div>
              <p className="pob-attrib-body">{t("notLawBody")}</p>
            </article>
          </div>
        </div>
      </section>

      <VoltageCallout
        eyebrow={t("ctaEyebrow")}
        title={t("ctaTitle")}
        desc={t("ctaDesc")}
        primaryLabel={tCommon("applyAsNode")}
        primaryHref="/apply"
        secondaryLabel={t("openWiki")}
        secondaryHref="/wiki"
      />
    </main>
  );
}
