"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { ExternalLink, FileText, Upload, Clock, MessageCircle } from "lucide-react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";
import { InternalNoteField, NoteFeed, NoteSectionCard } from "../../notes";

type ActivityEntry = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string | null; email: string | null } | null;
};

type FileEntry = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number | null;
  createdAt: string;
};

type ProjectData = {
  id: string;
  name: string;
  status: string;
  stage: string;
  sector: string | null;
  website: string | null;
  pitchUrl: string | null;
  description: string | null;
  fundraisingNeed: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactTelegram: string | null;
  confidentialityLevel: string;
  riskTags: string[];
  internalScore: number | null;
  internalNotes: string | null;
  createdAt?: string;
  updatedAt?: string;
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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectDetail({ project, isAdmin }: { project: ProjectData; isAdmin: boolean }) {
  const { t } = useAutoTranslate();
  const [status, setStatus] = useState(project.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmTransition, setConfirmTransition] = useState<string | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const nextStatuses = VALID_TRANSITIONS[status] ?? [];
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/projects/${project.id}/activity`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (d.ok) setActivity(d.data?.activity ?? []); })
      .catch((err) => console.error("[Project] activity fetch failed", err));
  }, [project.id, isAdmin]);

  useEffect(() => {
    fetch(`/api/projects/${project.id}/files`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (d.ok) setFiles(d.data?.files ?? []); })
      .catch((err) => console.error("[Project] files fetch failed", err));
  }, [project.id]);

  const updateStatus = useCallback(async (newStatus: string) => {
    setBusy(true);
    setError(null);
    setConfirmTransition(null);
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
  }, [project.id, t]);

  const adminPatch = useCallback(async (patch: Record<string, unknown>) => {
    setAdminSaving(true);
    setAdminMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.ok) setAdminMsg(data.error ?? t("Save failed."));
      else setAdminMsg(t("Saved"));
      setTimeout(() => setAdminMsg(null), 2000);
    } catch (e: any) {
      setAdminMsg(e?.message ?? t("Save failed."));
    } finally { setAdminSaving(false); }
  }, [project.id, t]);

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
      meta={
        <span className="flex items-center gap-12 flex-wrap">
          {project.node && (
            <span>{t("Node:")} <Link href={`/dashboard/nodes/${project.node.id}`} style={{ color: "var(--accent)" }}>{project.node.name}</Link></span>
          )}
          {project.createdAt && (
            <span className="flex items-center gap-4 muted text-xs">
              <Clock size={12} /> {t("Created")} {relativeTime(project.createdAt)}
            </span>
          )}
          {project.updatedAt && (
            <span className="muted text-xs">
              · {t("Updated")} {relativeTime(project.updatedAt)}
            </span>
          )}
        </span>
      }
    >
      {/* Status Flow */}
      <div className="card-glass p-18 reveal">
        <h3 className="mt-0 mb-12">{t("Pipeline")}</h3>
        <div className="flex items-center gap-4 flex-wrap mb-12">
          {PROJECT_FLOW.map((s, i) => {
            const idx = PROJECT_FLOW.indexOf(status as any);
            const isCurrent = s === status;
            const isPast = idx >= 0 && i < idx;
            return (
              <span key={s} className="flex items-center gap-4">
                {i > 0 && <span className="muted">→</span>}
                <span
                  className="badge text-xs"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    background: isCurrent ? "var(--accent)" : isPast ? "var(--green)" : "var(--bg-elev)",
                    color: isCurrent || isPast ? "#fff" : "var(--muted)",
                    fontWeight: isCurrent ? 700 : 400,
                    padding: "4px 12px",
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
              <span className="badge text-xs" style={{
                borderRadius: "var(--radius-pill)",
                background: status === "REJECTED" ? "var(--red)" : "var(--amber)",
                color: "#fff", fontWeight: 700, padding: "4px 12px",
              }}>
                {status.replace(/_/g, " ")}
              </span>
            </span>
          )}
        </div>
        {isAdmin && nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-8 items-center">
            <span className="muted text-sm">{t("Next:")}</span>
            {nextStatuses.map((s) => (
              confirmTransition === s ? (
                <span key={s} className="flex items-center gap-4">
                  <button className="button text-xs" disabled={busy} onClick={() => updateStatus(s)}>
                    {t("Confirm")} → {s.replace(/_/g, " ")}
                  </button>
                  <button className="button-secondary text-xs" onClick={() => setConfirmTransition(null)}>
                    {t("Cancel")}
                  </button>
                </span>
              ) : (
                <button key={s} className="button-secondary text-xs" disabled={busy} onClick={() => setConfirmTransition(s)}>
                  → {s.replace(/_/g, " ")}
                </button>
              )
            ))}
          </div>
        )}
        {error && <p className="form-error mt-8">{error}</p>}
      </div>

      {/* Stats + Details grid */}
      <div className="grid-2 gap-16 reveal reveal-delay-1">
        {/* Left: Details card */}
        <div className="card-glass p-18">
          <h3 className="mt-0 mb-12">{t("Details")}</h3>
          <div className="flex-col gap-10 text-base">
            {project.sector && <div><span className="muted">{t("Sector:")}</span> {project.sector}</div>}
            {project.website && (
              <div>
                <span className="muted">{t("Website:")}</span>{" "}
                <a href={project.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4" style={{ color: "var(--accent)", display: "inline-flex" }}>
                  {project.website} <ExternalLink size={12} />
                </a>
              </div>
            )}
            {project.pitchUrl && (
              <div>
                <span className="muted">{t("Pitch deck:")}</span>{" "}
                <a href={project.pitchUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                  {t("View pitch")} <ExternalLink size={12} />
                </a>
              </div>
            )}
            {project.fundraisingNeed && <div><span className="muted">{t("Fundraising:")}</span> {project.fundraisingNeed}</div>}
          </div>

          {(project.contactName || project.contactEmail || project.contactTelegram) && (
            <div className="mt-16">
              <h4 className="mt-0 mb-8 text-sm font-semibold">{t("Contact")}</h4>
              <div className="flex-col gap-6 text-base">
                {project.contactName && <div><span className="muted">{t("Name:")}</span> {project.contactName}</div>}
                {project.contactEmail && (
                  <div><span className="muted">{t("Email:")}</span> <a href={`mailto:${project.contactEmail}`} style={{ color: "var(--accent)" }}>{project.contactEmail}</a></div>
                )}
                {project.contactTelegram && (
                  <div className="flex items-center gap-4">
                    <MessageCircle size={13} className="muted" />
                    <span className="muted">{t("Telegram:")}</span>{" "}
                    <a href={`https://t.me/${project.contactTelegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                      {project.contactTelegram}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {project.description && (
            <div className="mt-16">
              <h4 className="mt-0 mb-4 text-sm font-semibold">{t("Description")}</h4>
              <p className="mt-0 mb-0" style={{ lineHeight: 1.6 }}>{project.description}</p>
            </div>
          )}

          {project.riskTags.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-12">
              {project.riskTags.map((tag) => <span key={tag} className="badge badge-red text-xs">{tag}</span>)}
            </div>
          )}
        </div>

        {/* Right: Stats */}
        <div className="flex-col gap-12">
          <div className="grid-2 gap-12">
            <StatCard label={t("Tasks")} value={project._count.tasks} />
            <StatCard label={t("Evidence")} value={project._count.evidence} />
            <StatCard label={t("PoB Records")} value={project._count.pobRecords} />
            <StatCard label={t("Deals")} value={project._count.deals} />
          </div>
          {isAdmin && project.internalScore != null && (
            <div className="card-glass p-18" style={{ textAlign: "center" }}>
              <span className="muted text-sm">{t("Internal Score")}</span>
              <div className="font-bold" style={{ fontSize: 28, color: "var(--accent)" }}>{project.internalScore}</div>
              <span className="muted text-xs">/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Files */}
      <div className="card-glass p-18 reveal reveal-delay-2">
        <div className="flex items-center justify-between mb-12">
          <h3 className="mt-0 mb-0">{t("Files")} ({files.length})</h3>
        </div>
        {files.length > 0 ? (
          <div className="flex-col gap-6">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-8 text-sm" style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <FileText size={14} className="muted" />
                <span className="font-semibold">{f.filename}</span>
                {f.sizeBytes != null && <span className="muted text-xs">{formatBytes(f.sizeBytes)}</span>}
                <span className="muted text-xs">{relativeTime(f.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted text-sm">{t("No files attached.")}</p>
        )}
      </div>

      {/* Tasks */}
      {project.tasks.length > 0 && (
        <div className="card-glass p-18 reveal reveal-delay-2">
          <h3 className="mt-0 mb-12">{t("Tasks")}</h3>
          <div className="flex-col gap-8">
            {project.tasks.map((task) => (
              <Link key={task.id} href={`/dashboard/tasks`} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${task.status === "CLOSED" || task.status === "ACCEPTED" ? "status-dot-green" : task.status === "CANCELLED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{task.title}</span>
                <span className="badge text-xs">{task.type}</span>
                <StatusBadge status={task.status} className="text-xs" />
              </Link>
            ))}
          </div>
          {project._count.tasks > project.tasks.length && (
            <Link href="/dashboard/tasks" className="muted text-sm mt-8" style={{ display: "inline-block", color: "var(--accent)" }}>
              {t("View all")} {project._count.tasks} {t("tasks")} →
            </Link>
          )}
        </div>
      )}

      {/* Deals */}
      {project.deals.length > 0 && (
        <div className="card-glass p-18 reveal reveal-delay-2">
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

      {/* Evidence */}
      {project.evidence.length > 0 && (
        <div className="card-glass p-18 reveal reveal-delay-3">
          <h3 className="mt-0 mb-12">{t("Evidence")} ({project.evidence.length})</h3>
          <div className="flex-col gap-8">
            {project.evidence.map((ev) => (
              <div key={ev.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${ev.reviewStatus === "APPROVED" ? "status-dot-green" : ev.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{ev.title || ev.type}</span>
                <StatusBadge status={ev.reviewStatus} className="text-xs" />
                <span className="muted text-xs">{relativeTime(ev.createdAt)}</span>
              </div>
            ))}
          </div>
          {project._count.evidence > project.evidence.length && (
            <p className="muted text-sm mt-8">{t("Showing")} {project.evidence.length} {t("of")} {project._count.evidence}</p>
          )}
        </div>
      )}

      {/* PoB Records */}
      {project.pobRecords.length > 0 && (
        <div className="card-glass p-18 reveal reveal-delay-3">
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
          {project._count.pobRecords > project.pobRecords.length && (
            <p className="muted text-sm mt-8">{t("Showing")} {project.pobRecords.length} {t("of")} {project._count.pobRecords}</p>
          )}
        </div>
      )}

      {/* Admin Panel */}
      {isAdmin && (
        <div className="card p-18 reveal" style={{ borderLeft: "3px solid var(--amber)" }}>
          <div className="flex items-center justify-between mb-12">
            <h3 className="mt-0 mb-0">{t("Admin Panel")}</h3>
            {adminSaving && <span className="muted text-xs">{t("Saving...")}</span>}
            {adminMsg && !adminSaving && <span className="text-xs" style={{ color: adminMsg === t("Saved") ? "var(--green)" : "var(--red)" }}>{adminMsg}</span>}
          </div>
          <div className="grid-2 gap-12">
            <label className="field">
              <span className="label">{t("Internal score")}</span>
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={project.internalScore ?? ""}
                onBlur={(e) => adminPatch({ internalScore: e.target.value ? Number(e.target.value) : null })}
              />
            </label>
            <label className="field">
              <span className="label">{t("Confidentiality")}</span>
              <select
                defaultValue={project.confidentialityLevel}
                onChange={(e) => adminPatch({ confidentialityLevel: e.target.value })}
              >
                {["PUBLIC", "CERTIFIED_NODE", "DEAL_ROOM", "RESTRICTED"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span className="label">{t("Risk tags")} <span className="muted text-xs">({t("comma-separated")})</span></span>
            <input
              defaultValue={project.riskTags.join(", ")}
              onBlur={(e) => adminPatch({ riskTags: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
            />
          </label>
          <InternalNoteField
            label={t("Internal notes")}
            defaultValue={project.internalNotes ?? ""}
            rows={4}
            onBlur={(v) => adminPatch({ internalNotes: v })}
          />
        </div>
      )}

      {/* Activity — same line list primitive as `notes/NoteFeed` */}
      {isAdmin && activity.length > 0 && (
        <NoteSectionCard title={t("Activity")} variant="glass">
          <NoteFeed
            items={activity.map((a) => ({
              id: a.id,
              body: (
                <>
                  <span className="font-semibold">{a.action.replace(/_/g, " ")}</span>
                  {a.metadata && (a.metadata as Record<string, unknown>).previousStatus != null && (
                    <span className="muted">
                      {" "}
                      {String((a.metadata as Record<string, string>).previousStatus)} →{" "}
                      {String((a.metadata as Record<string, string>).newStatus)}
                    </span>
                  )}
                </>
              ),
              meta: (
                <>
                  {a.actor?.name || a.actor?.email || t("System")} · {relativeTime(a.createdAt)}
                </>
              ),
            }))}
          />
        </NoteSectionCard>
      )}
    </DetailLayout>
  );
}
