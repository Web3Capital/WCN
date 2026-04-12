"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";

type ProjectData = {
  id: string;
  name: string;
  status: string;
  stage: string;
  sector: string | null;
  website: string | null;
  description: string | null;
  confidentialityLevel: string;
  riskTags: string[];
  internalScore: number | null;
  internalNotes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  fundraisingNeed: string | null;
  node: { id: string; name: string } | null;
  tasks: { id: string; title: string; status: string; type: string }[];
  evidence: { id: string; title: string | null; type: string; reviewStatus: string; createdAt: string }[];
  deals: { id: string; title: string; stage: string }[];
  pobRecords: { id: string; businessType: string; score: number; status: string }[];
  _count: { tasks: number; pobRecords: number; evidence: number; deals: number };
};

export function ProjectDetail({ project, isAdmin }: { project: ProjectData; isAdmin: boolean }) {
  const { t } = useAutoTranslate();
  const [status, setStatus] = useState(project.status);
  const [busy, setBusy] = useState(false);

  async function updateStatus(newStatus: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) setStatus(newStatus);
    } finally { setBusy(false); }
  }

  return (
    <DetailLayout
      backHref="/dashboard/projects"
      backLabel={t("All Projects")}
      title={project.name}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          <span className="badge">{project.stage}</span>
          {project.confidentialityLevel !== "PUBLIC" && (
            <span className="badge badge-purple">{project.confidentialityLevel}</span>
          )}
        </span>
      }
      meta={project.node ? (
        <span>{t("Node:")} <Link href={`/dashboard/nodes/${project.node.id}`} style={{ color: "var(--accent)" }}>{project.node.name}</Link></span>
      ) : undefined}
    >
      <div className="grid-2 gap-16">
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Details")}</h3>
          <div className="flex-col gap-8 text-base">
            {project.sector && <div><span className="muted">{t("Sector:")}</span> {project.sector}</div>}
            {project.website && <div><span className="muted">{t("Website:")}</span> <a href={project.website} target="_blank" rel="noopener noreferrer">{project.website}</a></div>}
            {project.fundraisingNeed && <div><span className="muted">{t("Fundraising:")}</span> {project.fundraisingNeed}</div>}
            {project.contactName && <div><span className="muted">{t("Contact:")}</span> {project.contactName}</div>}
            {project.contactEmail && <div><span className="muted">{t("Email:")}</span> {project.contactEmail}</div>}
            {project.description && <div className="mt-8"><span className="muted">{t("Description:")}</span><p className="mt-4 mb-0">{project.description}</p></div>}
          </div>
          {project.riskTags.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-12">
              {project.riskTags.map((tag) => <span key={tag} className="badge badge-red text-xs">{tag}</span>)}
            </div>
          )}
        </div>

        <div className="flex-col gap-16">
          <div className="grid-2 gap-12">
            <StatCard label={t("Tasks")} value={project._count.tasks} />
            <StatCard label={t("Evidence")} value={project._count.evidence} />
            <StatCard label={t("PoB records")} value={project._count.pobRecords} />
            <StatCard label={t("Deals")} value={project._count.deals} />
          </div>
          {isAdmin && project.internalScore != null && (
            <div className="card p-18">
              <span className="muted text-sm">{t("Internal score:")}</span>
              <span className="font-bold" style={{ marginLeft: 8 }}>{project.internalScore}</span>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Actions")}</h3>
          <div className="flex flex-wrap gap-8">
            {["SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM", "ACTIVE", "ON_HOLD", "REJECTED", "ARCHIVED"].map((s) => (
              <button
                key={s}
                className="button-secondary text-xs"
                disabled={busy || s === status}
                onClick={() => updateStatus(s)}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {project.tasks.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Tasks")}</h3>
          <div className="flex-col gap-8">
            {project.tasks.map((task) => (
              <Link key={task.id} href="/dashboard/tasks" className="flex items-center gap-8 text-base">
                <span className={`status-dot ${task.status === "CLOSED" || task.status === "ACCEPTED" ? "status-dot-green" : task.status === "CANCELLED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{task.title}</span>
                <span className="badge text-xs">{task.type}</span>
                <StatusBadge status={task.status} className="text-xs" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {project.deals.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Deals")}</h3>
          <div className="flex-col gap-8">
            {project.deals.map((d) => (
              <div key={d.id} className="flex items-center gap-8 text-base">
                <span className="status-dot status-dot-accent" />
                <span className="font-semibold">{d.title}</span>
                <span className="badge badge-purple text-xs">{d.stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && project.internalNotes && (
        <div className="card p-18" style={{ borderLeft: "3px solid var(--amber)" }}>
          <h3 className="mt-0 mb-8">{t("Internal Notes")}</h3>
          <p className="muted mt-0 mb-0" style={{ whiteSpace: "pre-wrap" }}>{project.internalNotes}</p>
        </div>
      )}
    </DetailLayout>
  );
}
