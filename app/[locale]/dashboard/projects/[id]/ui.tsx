"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";

type ActivityEntry = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string | null; email: string | null } | null;
};

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

const PROJECT_FLOW = ["DRAFT", "SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM", "ACTIVE", "APPROVED", "ARCHIVED"] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["SCREENED", "REJECTED"],
  SCREENED: ["CURATED", "REJECTED"],
  CURATED: ["IN_DEAL_ROOM", "ON_HOLD"],
  IN_DEAL_ROOM: ["ACTIVE", "ON_HOLD"],
  ACTIVE: ["APPROVED", "ON_HOLD", "ARCHIVED"],
  ON_HOLD: ["CURATED", "ACTIVE"],
  APPROVED: ["ARCHIVED"],
  REJECTED: ["DRAFT"],
  ARCHIVED: [],
};

export function ProjectDetail({ project, isAdmin }: { project: ProjectData; isAdmin: boolean }) {
  const { t } = useAutoTranslate();
  const [status, setStatus] = useState(project.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = VALID_TRANSITIONS[status] ?? [];
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/projects/${project.id}/activity`)
      .then((r) => { if (!r.ok) throw new Error(`Activity fetch failed: ${r.status}`); return r.json(); })
      .then((d) => { if (d.ok) setActivity(d.data?.activity ?? []); })
      .catch((err) => console.error("[Project] activity fetch failed", err));
  }, [project.id, isAdmin]);

  async function updateStatus(newStatus: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) setStatus(newStatus);
      else setError(data.error ?? t("Status change failed."));
    } catch (e: any) {
      setError(e?.message ?? t("Status change failed."));
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

      <div className="card p-18">
        <h3 className="mt-0 mb-12">{t("Status flow")}</h3>
        <div className="flex items-center gap-4 flex-wrap mb-12">
          {PROJECT_FLOW.map((s, i) => {
            const idx = PROJECT_FLOW.indexOf(status as any);
            const isCurrent = s === status;
            const isPast = idx >= 0 && i < idx;
            const isTerminal = status === "REJECTED" || status === "ON_HOLD";
            return (
              <span key={s} className="flex items-center gap-4">
                {i > 0 && <span className="muted">→</span>}
                <span
                  className="badge text-xs"
                  style={{
                    background: isCurrent ? "var(--accent)" : isPast ? "var(--green)" : "var(--bg-elev)",
                    color: isCurrent || isPast ? "#fff" : "var(--muted)",
                    fontWeight: isCurrent ? 700 : 400,
                  }}
                >
                  {s.replace(/_/g, " ")}
                </span>
              </span>
            );
          })}
          {(status === "REJECTED" || status === "ON_HOLD") && (
            <span className="flex items-center gap-4">
              <span className="muted">·</span>
              <span className="badge text-xs" style={{ background: status === "REJECTED" ? "var(--red)" : "var(--amber)", color: "#fff", fontWeight: 700 }}>
                {status.replace(/_/g, " ")}
              </span>
            </span>
          )}
        </div>
        {isAdmin && nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-8">
            <span className="muted text-sm">{t("Next:")}</span>
            {nextStatuses.map((s) => (
              <button
                key={s}
                className="button-secondary text-xs"
                disabled={busy}
                onClick={() => updateStatus(s)}
              >
                → {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
        {error && <p className="form-error mt-8">{error}</p>}
      </div>

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
              <Link key={d.id} href={`/dashboard/deals/${d.id}`} className="flex items-center gap-8 text-base">
                <span className="status-dot status-dot-accent" />
                <span className="font-semibold">{d.title}</span>
                <span className="badge badge-purple text-xs">{d.stage}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {project.evidence.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Evidence")} ({project.evidence.length})</h3>
          <div className="flex-col gap-8">
            {project.evidence.map((ev) => (
              <div key={ev.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${ev.reviewStatus === "APPROVED" ? "status-dot-green" : ev.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{ev.title || ev.type}</span>
                <StatusBadge status={ev.reviewStatus} className="text-xs" />
                <span className="muted text-xs">{new Date(ev.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {project.pobRecords.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("PoB Records")} ({project.pobRecords.length})</h3>
          <div className="flex-col gap-8">
            {project.pobRecords.map((pob) => (
              <Link key={pob.id} href={`/dashboard/pob/${pob.id}`} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${pob.status === "EFFECTIVE" ? "status-dot-green" : pob.status === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{pob.businessType}</span>
                <span className="badge text-xs">{t("Score:")} {pob.score}</span>
                <StatusBadge status={pob.status} className="text-xs" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card p-18" style={{ borderLeft: "3px solid var(--amber)" }}>
          <h3 className="mt-0 mb-12">{t("Admin Panel")}</h3>
          <div className="grid-2 gap-12">
            <label className="field">
              <span className="label">{t("Internal score")}</span>
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={project.internalScore ?? ""}
                onBlur={(e) => {
                  fetch(`/api/projects/${project.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ internalScore: e.target.value ? Number(e.target.value) : null }),
                  });
                }}
              />
            </label>
            <label className="field">
              <span className="label">{t("Confidentiality")}</span>
              <select
                defaultValue={project.confidentialityLevel}
                onChange={(e) => {
                  fetch(`/api/projects/${project.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ confidentialityLevel: e.target.value }),
                  });
                }}
              >
                {["PUBLIC", "CERTIFIED_NODE", "DEAL_ROOM", "RESTRICTED"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span className="label">{t("Risk tags")} <span className="muted text-xs">({t("comma-separated")})</span></span>
            <input
              defaultValue={project.riskTags.join(", ")}
              onBlur={(e) => {
                fetch(`/api/projects/${project.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ riskTags: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) }),
                });
              }}
            />
          </label>
          <label className="field">
            <span className="label">{t("Internal notes")}</span>
            <textarea
              defaultValue={project.internalNotes ?? ""}
              rows={4}
              onBlur={(e) => {
                fetch(`/api/projects/${project.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ internalNotes: e.target.value }),
                });
              }}
            />
          </label>
        </div>
      )}

      {isAdmin && activity.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Activity")}</h3>
          <div className="flex-col gap-8">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-8 text-sm" style={{ borderLeft: "2px solid var(--line)", paddingLeft: 12 }}>
                <div>
                  <span className="font-semibold">{a.action.replace(/_/g, " ")}</span>
                  {a.metadata && (a.metadata as any).previousStatus && (
                    <span className="muted"> {(a.metadata as any).previousStatus} → {(a.metadata as any).newStatus}</span>
                  )}
                  <div className="muted text-xs">
                    {a.actor?.name || a.actor?.email || t("System")} · {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
