"use client";

import { DetailLayout, StatCard } from "../../../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type NodeData = {
  id: string;
  name: string;
  status: string;
  onboardingScore: number | null;
  contractSentAt: string | null;
  goLiveAt: string | null;
  projects: { id: string; name: string; status: string }[];
  tasksAsOwner: { id: string; title: string; status: string }[];
};

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-10 border-b" style={{ padding: "8px 0" }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: done ? "var(--green)" : "var(--line)",
        color: done ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: 700,
      }}>
        {done ? "✓" : "·"}
      </span>
      <span style={{ fontSize: 13, fontWeight: done ? 400 : 600, color: done ? "var(--muted)" : "var(--text)" }}>{label}</span>
    </div>
  );
}

export function NodeOnboardingUI({ node, isAdmin }: { node: NodeData; isAdmin: boolean }) {
  const { t } = useAutoTranslate();
  const hasContract = !!node.contractSentAt;
  const hasProjects = node.projects.length > 0;
  const hasTasks = node.tasksAsOwner.length > 0;
  const isLive = node.status === "LIVE";

  const steps = [
    { label: t("Profile completed"), done: true },
    { label: t("Contract sent"), done: hasContract },
    { label: t("First pipeline project added"), done: hasProjects },
    { label: t("First task assigned"), done: hasTasks },
    { label: t("Node goes live"), done: isLive },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <DetailLayout
      backHref={`/dashboard/nodes/${node.id}`}
      backLabel={t(`Back to ${node.name}`)}
      title={t(`Onboarding: ${node.name}`)}
      subtitle={t("Track onboarding progress for the first 14 days.")}
    >
      <div className="card p-20">
        <div className="flex-between mb-12">
          <h2 className="text-lg font-semibold mt-0 mb-0">{t("Progress")}</h2>
          <span className="stat-number" style={{ fontSize: 24 }}>{progress}%</span>
        </div>

        <div className="progress-bar mb-16">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {node.onboardingScore != null && (
          <p className="muted text-xs mb-12">
            {t("Onboarding Score:")} <strong>{node.onboardingScore}/100</strong>
          </p>
        )}

        <div>
          {steps.map((s) => <CheckItem key={s.label} label={s.label} done={s.done} />)}
        </div>
      </div>

      <div className="grid-4">
        <StatCard label={t("Projects")} value={node.projects.length} />
        <StatCard label={t("Tasks Owned")} value={node.tasksAsOwner.length} />
        <StatCard label={t("Contract")} value={hasContract ? t("Sent") : t("Pending")} />
        <StatCard label={t("Go Live")} value={node.goLiveAt ? new Date(node.goLiveAt).toLocaleDateString() : t("Not yet")} />
      </div>
    </DetailLayout>
  );
}
