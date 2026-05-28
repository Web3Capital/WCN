import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
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
import { VoltageCallout } from "@/components/brand/voltage-callout";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  const t = await getTranslations({ locale, namespace: "nodes" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

export default async function NodesPage() {
  const t = await getTranslations("nodes");
  const tCommon = await getTranslations("common");

  const nodeLayers = [
    {
      code: "GLOBAL" as const,
      tier: t("tier1Badge"),
      label: t("tier1Label"),
      desc: t("tier1Desc"),
      accent: "accent" as const,
    },
    {
      code: "REGION" as const,
      tier: t("tier2Badge"),
      label: t("tier2Label"),
      desc: t("tier2Desc"),
      accent: "green" as const,
    },
    {
      code: "CITY" as const,
      tier: t("tier3Badge"),
      label: t("tier3Label"),
      desc: t("tier3Desc"),
      accent: "amber" as const,
    },
    {
      code: "INDUSTRY" as const,
      tier: t("tier4Badge"),
      label: t("tier4Label"),
      desc: t("tier4Desc"),
      accent: "purple" as const,
    },
    {
      code: "FUNCTIONAL" as const,
      tier: t("tier5Badge"),
      label: t("tier5Label"),
      desc: t("tier5Desc"),
      accent: "muted" as const,
    },
    {
      code: "AGENT" as const,
      tier: t("tier6Badge"),
      label: t("tier6Label"),
      desc: t("tier6Desc"),
      accent: "accent" as const,
    },
  ];

  const responsibilityLoop = [
    { title: t("resp1Title"), body: t("resp1Body") },
    { title: t("resp2Title"), body: t("resp2Body") },
    { title: t("resp3Title"), body: t("resp3Body") },
    { title: t("resp4Title"), body: t("resp4Body") },
  ];

  const lifecycle = [
    {
      title: t("life1Title"),
      body: t("life1Body"),
      icon: <Inbox size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("life2Title"),
      body: t("life2Body"),
      icon: <UserCheck size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("life3Title"),
      body: t("life3Body"),
      icon: <FileSignature size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("life4Title"),
      body: t("life4Body"),
      icon: <GitBranch size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("life5Title"),
      body: t("life5Body"),
      icon: <ClipboardCheck size={20} strokeWidth={2} aria-hidden />,
    },
  ];

  const governanceRows = [
    {
      kicker: "№ 04·a",
      tone: "green" as const,
      label: t("govAdmission"),
      text: t("govAdmissionText"),
    },
    {
      kicker: "№ 04·b",
      tone: "amber" as const,
      label: t("govUpgrade"),
      text: t("govUpgradeText"),
    },
    {
      kicker: "№ 04·c",
      tone: "red" as const,
      label: t("govRemoval"),
      text: t("govRemovalText"),
    },
  ];

  const areBullets = [t("areBullet1"), t("areBullet2"), t("areBullet3"), t("areBullet4")];
  const notBullets = [t("notBullet1"), t("notBullet2"), t("notBullet3"), t("notBullet4")];

  return (
    <main className="nodes-page">
      <section className="section hero hero-orb">
        <div className="container">
          <div className="nodes-masthead" aria-hidden>
            <span className="nodes-masthead-mark">№ 04</span>
            <span className="nodes-masthead-rule" />
            <span className="nodes-masthead-section">{t("eyebrow")}</span>
            <span className="nodes-masthead-rule" />
            <span className="nodes-masthead-meta">Volume · MMXXVI</span>
          </div>
          <div className="section-head">
            <h1 className="nodes-hero-title">{t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}</h1>
            <p className="muted hero-lede nodes-hero-lede">
              {t.rich("lede", {
                strong: (chunks) => <strong className="nodes-strong">{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="nodes-hero-grid card-grid-animated">
            <div className="nodes-hero-copy">
              <span className="nodes-editor-kicker">Editor’s note</span>
              <p className="nodes-hero-sublede nodes-hero-sublede--dropcap">{t("subLede")}</p>
              <div className="nodes-hero-ctas">
                <Link href="/apply" className="button">
                  {tCommon("applyAsNode")}
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link href="/how-it-works" className="button-secondary">
                  {tCommon("howItWorks")}
                </Link>
              </div>
            </div>

            <aside className="nodes-loop-panel" aria-label={t("loopPanelAria")}>
              <div className="nodes-loop-head">
                <Network size={22} className="nodes-loop-icon" aria-hidden />
                <span>{t("responsibilityLoop")}</span>
              </div>
              <ol className="nodes-loop-list">
                {responsibilityLoop.map((step, i) => (
                  <li key={step.title} className="nodes-loop-item">
                    <span className="nodes-loop-index" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="nodes-loop-dot" aria-hidden />
                    <div className="nodes-loop-text">
                      <div className="nodes-loop-title">{step.title}</div>
                      <p className="nodes-loop-body">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow">{t("clarityEyebrow")}</span>
            <h2 className="nodes-section-h2">{t("clarityTitle")}</h2>
          </div>
          <div className="grid-2 nodes-dual-grid card-grid-animated">
            <article className="card nodes-dual-card nodes-dual-yes">
              <div className="nodes-dual-head">
                <span className="nodes-dual-sigil" aria-hidden>+</span>
                <div className="nodes-dual-titlewrap">
                  <span className="nodes-dual-kicker">Affirmative</span>
                  <h3 className="nodes-dual-title">{t("nodesAre")}</h3>
                </div>
                <ShieldCheck className="nodes-dual-icon-svg" size={20} strokeWidth={1.75} aria-hidden />
              </div>
              <ol className="nodes-dual-list">
                {areBullets.map((item, i) => (
                  <li key={item} className="nodes-dual-row">
                    <span className="nodes-dual-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <span className="nodes-dual-text">{item}</span>
                  </li>
                ))}
              </ol>
            </article>
            <article className="card nodes-dual-card nodes-dual-no">
              <div className="nodes-dual-head">
                <span className="nodes-dual-sigil nodes-dual-sigil--muted" aria-hidden>−</span>
                <div className="nodes-dual-titlewrap">
                  <span className="nodes-dual-kicker nodes-dual-kicker--muted">Negative</span>
                  <h3 className="nodes-dual-title">{t("nodesAreNot")}</h3>
                </div>
                <XCircle className="nodes-dual-icon-svg nodes-dual-icon-svg--muted" size={20} strokeWidth={1.75} aria-hidden />
              </div>
              <ol className="nodes-dual-list">
                {notBullets.map((item, i) => (
                  <li key={item} className="nodes-dual-row">
                    <span className="nodes-dual-num nodes-dual-num--muted" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <span className="nodes-dual-text">{item}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow">{t("hierarchyEyebrow")}</span>
            <h2 className="nodes-section-h2">{t("hierarchyTitle")}</h2>
            <p className="muted hero-lede">{t("hierarchyDesc")}</p>
          </div>
          <div className="nodes-tier-bento card-grid-animated">
            {nodeLayers.map((layer, i) => (
              <article
                key={layer.code}
                className={`nodes-tier-card nodes-tier-card--${layer.accent}`}
              >
                <span className="nodes-tier-numeral" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`nodes-tier-badge nodes-tier-badge--${layer.accent}`}>{layer.tier}</span>
                <code className="nodes-tier-enum">{layer.code}</code>
                <h3 className="nodes-tier-title">{layer.label}</h3>
                <p className="nodes-tier-desc">{layer.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">№ 03</span>
            <span className="eyebrow">{t("lifecycleEyebrow")}</span>
            <h2 className="nodes-section-h2">{t("lifecycleTitle")}</h2>
            <p className="muted hero-lede">{t("lifecycleDesc")}</p>
          </div>
          <ol className="nodes-lifecycle-editorial card-grid-animated">
            {lifecycle.map((step, i) => (
              <li key={step.title} className="nodes-life-row">
                <span className="nodes-life-num" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="nodes-life-content">
                  <div className="nodes-life-head">
                    <span className="nodes-life-icon" aria-hidden>{step.icon}</span>
                    <h3 className="nodes-life-title">{step.title}</h3>
                  </div>
                  <p className="nodes-life-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">№ 04</span>
            <span className="eyebrow">{t("governanceEyebrow")}</span>
            <h2 className="nodes-section-h2">{t("governanceTitle")}</h2>
          </div>
          <div className="grid-3 nodes-gov-grid card-grid-animated">
            {governanceRows.map((row) => (
              <article key={row.label} className={`card nodes-gov-card nodes-gov-card--${row.tone}`}>
                <div className="nodes-gov-kicker">
                  <span className="nodes-gov-kicker-num">{row.kicker}</span>
                  <span className="nodes-gov-kicker-rule" aria-hidden />
                  <span className="nodes-gov-kicker-label">{row.label}</span>
                </div>
                <p className="nodes-gov-text">{row.text}</p>
              </article>
            ))}
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
