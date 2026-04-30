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

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
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
      badge: "badge-green",
      label: t("govAdmission"),
      text: t("govAdmissionText"),
    },
    {
      badge: "badge-amber",
      label: t("govUpgrade"),
      text: t("govUpgradeText"),
    },
    {
      badge: "badge-red",
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
          <div className="section-head">
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1>{t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}</h1>
            <p className="muted hero-lede">
              {t.rich("lede", {
                strong: (chunks) => <strong className="nodes-strong">{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="nodes-hero-grid card-grid-animated">
            <div className="nodes-hero-copy">
              <p className="muted" style={{ fontSize: 17, lineHeight: 1.65, marginBottom: 0 }}>
                {t("subLede")}
              </p>
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

            <div className="nodes-loop-panel" aria-label={t("loopPanelAria")}>
              <div className="nodes-loop-head">
                <Network size={22} className="nodes-loop-icon" aria-hidden />
                <span>{t("responsibilityLoop")}</span>
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
          <div className="section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow">{t("clarityEyebrow")}</span>
            <h2>{t("clarityTitle")}</h2>
          </div>
          <div className="grid-2 card-grid-animated">
            <div className="card nodes-dual-card nodes-dual-yes">
              <div className="nodes-dual-icon" aria-hidden>
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <h3>{t("nodesAre")}</h3>
              <ul className="nodes-list">
                {areBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card nodes-dual-card nodes-dual-no">
              <div className="nodes-dual-icon nodes-dual-icon-muted" aria-hidden>
                <XCircle size={24} strokeWidth={2} />
              </div>
              <h3>{t("nodesAreNot")}</h3>
              <ul className="nodes-list">
                {notBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow">{t("hierarchyEyebrow")}</span>
            <h2>{t("hierarchyTitle")}</h2>
            <p className="muted hero-lede">{t("hierarchyDesc")}</p>
          </div>
          <div className="nodes-tier-bento card-grid-animated">
            {nodeLayers.map((layer) => (
              <article
                key={layer.code}
                className={`nodes-tier-card nodes-tier-card--${layer.accent}`}
              >
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
            <h2>{t("lifecycleTitle")}</h2>
            <p className="muted hero-lede">{t("lifecycleDesc")}</p>
          </div>
          <div className="nodes-lifecycle card-grid-animated">
            {lifecycle.map((step, i) => (
              <div key={step.title} className="nodes-lifecycle-card">
                <div className="nodes-lifecycle-inner">
                  <div className="nodes-lifecycle-icon">{step.icon}</div>
                  <div className="nodes-lifecycle-step">{t("lifecycleStep", { n: i + 1 })}</div>
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
          <div className="section-head section-head-numbered">
            <span className="section-number">№ 04</span>
            <span className="eyebrow">{t("governanceEyebrow")}</span>
            <h2>{t("governanceTitle")}</h2>
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
