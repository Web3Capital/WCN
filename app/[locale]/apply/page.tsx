import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Landmark, Box, Wrench, Globe, Megaphone, Factory } from "lucide-react";
import { ApplyForm } from "./ui";
import { VoltageCallout } from "@/components/brand/voltage-callout";

const NODE_TYPES: { icon: ReactNode; titleKey: string; descKey: string }[] = [
  { icon: <Landmark size={20} strokeWidth={1.5} />, titleKey: "capitalTitle", descKey: "capitalDesc" },
  { icon: <Box size={20} strokeWidth={1.5} />, titleKey: "projectTitle", descKey: "projectDesc" },
  { icon: <Wrench size={20} strokeWidth={1.5} />, titleKey: "serviceTitle", descKey: "serviceDesc" },
  { icon: <Globe size={20} strokeWidth={1.5} />, titleKey: "regionalTitle", descKey: "regionalDesc" },
  { icon: <Megaphone size={20} strokeWidth={1.5} />, titleKey: "mediaTitle", descKey: "mediaDesc" },
  { icon: <Factory size={20} strokeWidth={1.5} />, titleKey: "industryTitle", descKey: "industryDesc" },
];

const STEPS = [
  { num: 1, titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { num: 2, titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { num: 3, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
  { num: 4, titleKey: "step4Title" as const, descKey: "step4Desc" as const },
] as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "apply" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ApplyPage() {
  const t = await getTranslations("apply");

  return (
    <main className="apply-page">
      <div className="container">
        <div className="apply-hero">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}</h1>
          <p className="apply-hero-desc">{t("heroDesc")}</p>
        </div>

        <div className="apply-layout">
          <div className="apply-form-col">
            <div className="card apply-form-card">
              <ApplyForm />
            </div>
          </div>

          <div className="apply-info-col">
            <div className="card apply-info-card">
              <h3 className="apply-info-title">{t("howItWorks")}</h3>
              <div className="apply-steps">
                {STEPS.map((step) => (
                  <div key={step.num} className="apply-step">
                    <span className="apply-step-num">{step.num}</span>
                    <div>
                      <strong>{t(step.titleKey)}</strong>
                      <p>{t(step.descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card apply-info-card">
              <h3 className="apply-info-title">{t("nodeTypesTitle")}</h3>
              <div className="apply-node-types">
                {NODE_TYPES.map((node) => (
                  <div key={node.titleKey} className="apply-node-type">
                    <span className="apply-node-icon">{node.icon}</span>
                    <div>
                      <strong>{t(node.titleKey)}</strong>
                      <p>{t(node.descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card apply-info-card apply-tip-card">
              <p>
                <strong>{t("tipLabel")}</strong> {t("tipMessage")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <VoltageCallout
        eyebrow={t("ctaEyebrow")}
        title={t("ctaTitle")}
        desc={t("ctaDesc")}
        primaryLabel={t("ctaPrimary")}
        primaryHref="/wiki"
        secondaryLabel={t("ctaSecondary")}
        secondaryHref="/how-it-works"
      />
    </main>
  );
}
