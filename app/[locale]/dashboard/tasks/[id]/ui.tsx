"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Clock } from "lucide-react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";

type TaskData = {
  id: string;
  title: string;
  type: string;
  status: string;
  description: string | null;
  dueAt: string | null;
  evidenceRequired: string[];
  acceptanceOwner: string | null;
  assigneeUserId: string | null;
  createdAt?: string;
  updatedAt?: string;
  project: { id: string; name: string; status: string } | null;
  ownerNode: { id: string; name: string } | null;
  deal: { id: string; title: string; stage: string } | null;
  assignments: { id: string; node: { id: string; name: string } }[];
  evidences: { id: string; title: string | null; type: string; reviewStatus: string; createdAt: string }[];
  pobRecords: { id: string; businessType: string; status: string; score: number }[];
  agentRuns: { id: string; status: string; cost: number | null; startedAt: string; finishedAt: string | null }[];
  _count?: { assignments: number; evidences: number; pobRecords: number; agentRuns: number };
};

const EVIDENCE_TYPES = ["CONTRACT", "TRANSFER", "REPORT", "SCREENSHOT", "LINK", "ONCHAIN_TX", "OTHER"] as const;

const TASK_FLOW = ["DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "ACCEPTED", "CLOSED"] as const;

const VALID_TRANSITIONS: Record<string, { label: string; target: string; primary?: boolean }[]> = {
  DRAFT: [{ label: "Assign", target: "ASSIGNED" }],
  OPEN: [{ label: "Assign", target: "ASSIGNED" }, { label: "Start Work", target: "IN_PROGRESS" }],
  ASSIGNED: [{ label: "Start Work", target: "IN_PROGRESS", primary: true }],
  IN_PROGRESS: [{ label: "Submit for Review", target: "SUBMITTED", primary: true }, { label: "Block", target: "BLOCKED" }],
  SUBMITTED: [{ label: "Approve", target: "ACCEPTED", primary: true }, { label: "Request Rework", target: "REWORK" }],
  ACCEPTED: [{ label: "Close", target: "CLOSED", primary: true }],
  REWORK: [{ label: "Resume Work", target: "IN_PROGRESS", primary: true }],
  BLOCKED: [{ label: "Unblock", target: "IN_PROGRESS", primary: true }],
  WAITING_REVIEW: [{ label: "Approve", target: "ACCEPTED", primary: true }, { label: "Request Rework", target: "REWORK" }],
  DONE: [{ label: "Close", target: "CLOSED", primary: true }],
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

export function TaskDetail({
  task,
  isAdmin,
  canReviewEvidence = false,
}: {
  task: TaskData;
  isAdmin: boolean;
  canReviewEvidence?: boolean;
}) {
  const { t } = useAutoTranslate();
  const [status, setStatus] = useState(task.status);
  const [evidences, setEvidences] = useState(task.evidences);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: "", type: "REPORT" as string, summary: "", url: "" });
  const [reviewComment, setReviewComment] = useState("");
  const [confirmTransition, setConfirmTransition] = useState<string | null>(null);

  async function transition(s: string) {
    setBusy(true);
    setError(null);
    setConfirmTransition(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      const data = await res.json();
      if (data.ok) setStatus(s);
      else setError(data.error || t("Transition failed."));
    } catch (e: any) {
      setError(e?.message ?? t("Transition failed."));
    } finally {
      setBusy(false);
    }
  }

  async function submitOutput() {
    setBusy(true);
    setError(null);
    try {
      const evRes = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: submitForm.type,
          title: submitForm.title || `Output: ${task.title}`,
          summary: submitForm.summary,
          url: submitForm.url || undefined,
          taskId: task.id,
          dealId: task.deal?.id,
          projectId: task.project?.id,
          nodeId: task.ownerNode?.id,
          reviewStatus: "SUBMITTED",
        }),
      });
      const evData = await evRes.json();
      if (!evData?.ok) throw new Error(evData?.error ?? t("Evidence creation failed."));

      const transRes = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" }),
      });
      const transData = await transRes.json();
      if (transData.ok) {
        setStatus("SUBMITTED");
        setEvidences((prev) => [evData.data, ...prev]);
      }
      setShowSubmit(false);
      setSubmitForm({ title: "", type: "REPORT", summary: "", url: "" });
    } catch (e: any) {
      setError(e?.message ?? t("Submit failed."));
    } finally {
      setBusy(false);
    }
  }

  async function reviewEvidence(evidenceId: string, decision: "APPROVED" | "REJECTED") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/evidence/${evidenceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: decision, reviewComment: reviewComment || undefined }),
      });
      const data = await res.json();
      if (data?.ok) {
        setEvidences((prev) => prev.map((e) => (e.id === evidenceId ? { ...e, reviewStatus: decision } : e)));
        setReviewComment("");
      } else {
        setError(data?.error ?? t("Review failed."));
      }
    } finally {
      setBusy(false);
    }
  }

  const canSubmitOutput = ["IN_PROGRESS", "REWORK"].includes(status);
  const canReview = (isAdmin || canReviewEvidence) && ["SUBMITTED", "WAITING_REVIEW"].includes(status);
  const actions = VALID_TRANSITIONS[status] ?? [];

  const counts = task._count ?? {
    assignments: task.assignments.length,
    evidences: task.evidences.length,
    pobRecords: task.pobRecords.length,
    agentRuns: task.agentRuns.length,
  };

  return (
    <DetailLayout
      backHref="/dashboard/tasks"
      backLabel={t("All Tasks")}
      title={task.title}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          <span className="badge">{task.type}</span>
        </span>
      }
      meta={
        <span className="flex items-center gap-12 flex-wrap">
          {task.ownerNode && (
            <span>
              {t("Node:")}{" "}
              <Link href={`/dashboard/nodes/${task.ownerNode.id}`} style={{ color: "var(--accent)" }}>
                {task.ownerNode.name}
              </Link>
            </span>
          )}
          {task.project && (
            <span>
              {t("Project:")}{" "}
              <Link href={`/dashboard/projects/${task.project.id}`} style={{ color: "var(--accent)" }}>
                {task.project.name}
              </Link>
            </span>
          )}
          {task.deal && (
            <span>
              {t("Deal:")}{" "}
              <Link href={`/dashboard/deals/${task.deal.id}`} style={{ color: "var(--accent)" }}>
                {task.deal.title}
              </Link>
            </span>
          )}
          {task.dueAt && (
            <span className="muted text-xs">
              {t("Due:")} {new Date(task.dueAt).toLocaleDateString()}
            </span>
          )}
          {task.createdAt && (
            <span className="flex items-center gap-4 muted text-xs">
              <Clock size={12} /> {t("Created")} {relativeTime(task.createdAt)}
            </span>
          )}
          {task.updatedAt && (
            <span className="muted text-xs">· {t("Updated")} {relativeTime(task.updatedAt)}</span>
          )}
        </span>
      }
    >
      {/* Pipeline Flow */}
      <div className="card-glass p-18 reveal">
        <h3 className="mt-0 mb-12">{t("Pipeline")}</h3>
        <div className="flex items-center gap-4 flex-wrap mb-12">
          {TASK_FLOW.map((s, i) => {
            const idx = TASK_FLOW.indexOf(status as any);
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
          {(status === "CANCELLED" || status === "BLOCKED" || status === "REWORK" || status === "WAITING_REVIEW" || status === "DONE") && (
            <span className="flex items-center gap-4">
              <span className="muted">·</span>
              <span
                className="badge text-xs"
                style={{
                  borderRadius: "var(--radius-pill)",
                  background: status === "CANCELLED" ? "var(--red)" : status === "BLOCKED" ? "var(--red)" : "var(--amber)",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "4px 12px",
                }}
              >
                {status.replace(/_/g, " ")}
              </span>
            </span>
          )}
        </div>

        {isAdmin && actions.length > 0 && (
          <div className="flex flex-wrap gap-8 items-center">
            <span className="muted text-sm">{t("Next:")}</span>
            {actions.map((a) =>
              confirmTransition === a.target ? (
                <span key={a.target} className="flex items-center gap-4">
                  <button className="button text-xs" disabled={busy} onClick={() => transition(a.target)}>
                    {t("Confirm")} → {a.target.replace(/_/g, " ")}
                  </button>
                  <button className="button-secondary text-xs" onClick={() => setConfirmTransition(null)}>
                    {t("Cancel")}
                  </button>
                </span>
              ) : (
                <button
                  key={a.target}
                  className={a.primary ? "button text-xs" : "button-secondary text-xs"}
                  disabled={busy}
                  onClick={() => setConfirmTransition(a.target)}
                >
                  → {t(a.label)}
                </button>
              )
            )}
            {canSubmitOutput && (
              <button className="button text-xs" disabled={busy} onClick={() => setShowSubmit(true)}>
                {t("Submit Output + Evidence")}
              </button>
            )}
            {status !== "CANCELLED" && status !== "CLOSED" && (
              <button
                className="button-secondary text-xs"
                style={{ opacity: 0.6 }}
                disabled={busy}
                onClick={() => setConfirmTransition("CANCELLED")}
              >
                {t("Cancel Task")}
              </button>
            )}
          </div>
        )}
        {!isAdmin && canSubmitOutput && (
          <div className="flex flex-wrap gap-8 items-center mt-8">
            <button className="button text-xs" disabled={busy} onClick={() => setShowSubmit(true)}>
              {t("Submit Output + Evidence")}
            </button>
          </div>
        )}
        {error && <p className="form-error mt-8">{error}</p>}
      </div>

      {/* Submit Output Form */}
      {showSubmit && (
        <div className="card-glass p-18 reveal" style={{ border: "2px solid var(--accent)" }}>
          <h3 className="mt-0 mb-12">{t("Submit Task Output")}</h3>
          <div className="form" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">{t("Evidence Title")}</span>
              <input
                value={submitForm.title}
                onChange={(e) => setSubmitForm((s) => ({ ...s, title: e.target.value }))}
                placeholder={`Output: ${task.title}`}
              />
            </label>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Evidence Type")}</span>
                <select value={submitForm.type} onChange={(e) => setSubmitForm((s) => ({ ...s, type: e.target.value }))}>
                  {EVIDENCE_TYPES.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("URL (optional)")}</span>
                <input
                  value={submitForm.url}
                  onChange={(e) => setSubmitForm((s) => ({ ...s, url: e.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </div>
            <label className="field">
              <span className="label">{t("Summary")}</span>
              <textarea
                value={submitForm.summary}
                onChange={(e) => setSubmitForm((s) => ({ ...s, summary: e.target.value }))}
                placeholder={t("Describe the work completed and deliverables...")}
                style={{ minHeight: 80 }}
              />
            </label>
            <div className="flex gap-8">
              <button className="button" disabled={busy || !submitForm.summary.trim()} onClick={submitOutput}>
                {busy ? t("Submitting...") : t("Submit Output")}
              </button>
              <button className="button-secondary" onClick={() => setShowSubmit(false)}>
                {t("Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details + Stats grid */}
      <div className="grid-2 gap-16 reveal reveal-delay-1">
        <div className="card-glass p-18">
          <h3 className="mt-0 mb-12">{t("Details")}</h3>
          <div className="flex-col gap-10 text-base">
            {task.description && (
              <div>
                <h4 className="mt-0 mb-4 text-sm font-semibold">{t("Description")}</h4>
                <p className="mt-0 mb-0" style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{task.description}</p>
              </div>
            )}
            {task.project && (
              <div>
                <span className="muted">{t("Project:")}</span>{" "}
                <Link href={`/dashboard/projects/${task.project.id}`} style={{ color: "var(--accent)" }}>
                  {task.project.name}
                </Link>
                <StatusBadge status={task.project.status} className="text-xs" />
              </div>
            )}
            {task.deal && (
              <div>
                <span className="muted">{t("Deal:")}</span>{" "}
                <Link href={`/dashboard/deals/${task.deal.id}`} style={{ color: "var(--accent)" }}>
                  {task.deal.title}
                </Link>
                <span className="badge badge-purple text-xs">{task.deal.stage}</span>
              </div>
            )}
            {task.ownerNode && (
              <div>
                <span className="muted">{t("Owner Node:")}</span>{" "}
                <Link href={`/dashboard/nodes/${task.ownerNode.id}`} style={{ color: "var(--accent)" }}>
                  {task.ownerNode.name}
                </Link>
              </div>
            )}
            {task.dueAt && (
              <div>
                <span className="muted">{t("Due:")}</span>{" "}
                <span style={new Date(task.dueAt).getTime() < Date.now() ? { color: "var(--red)", fontWeight: 600 } : undefined}>
                  {new Date(task.dueAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {task.acceptanceOwner && (
              <div>
                <span className="muted">{t("Acceptance Owner:")}</span> {task.acceptanceOwner}
              </div>
            )}
          </div>

          {task.evidenceRequired.length > 0 && (
            <div className="mt-16">
              <h4 className="mt-0 mb-8 text-sm font-semibold">{t("Evidence Required")}</h4>
              <div className="flex flex-wrap gap-6">
                {task.evidenceRequired.map((e) => (
                  <span key={e} className="badge badge-amber text-xs">{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-col gap-12">
          <div className="grid-2 gap-12">
            <StatCard label={t("Assignments")} value={counts.assignments} />
            <StatCard label={t("Evidence")} value={counts.evidences} />
            <StatCard label={t("PoB Records")} value={counts.pobRecords} />
            <StatCard label={t("Agent Runs")} value={counts.agentRuns} />
          </div>
        </div>
      </div>

      {/* Assignments */}
      <div className="card-glass p-18 reveal reveal-delay-2">
        <h3 className="mt-0 mb-12">{t("Assignments")} ({task.assignments.length})</h3>
        {task.assignments.length > 0 ? (
          <div className="flex-col gap-8">
            {task.assignments.map((a) => (
              <Link key={a.id} href={`/dashboard/nodes/${a.node.id}`} className="flex items-center gap-8 text-base">
                <span className="status-dot status-dot-accent" />
                <span className="font-semibold">{a.node.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted text-sm">{t("No assignments yet.")}</p>
        )}
      </div>

      {/* Evidence */}
      <div className="card-glass p-18 reveal reveal-delay-2">
        <h3 className="mt-0 mb-12">{t("Evidence")} ({evidences.length})</h3>
        {evidences.length > 0 ? (
          <div className="flex-col gap-12">
            {evidences.map((e) => (
              <div key={e.id} style={{ padding: 12, background: "var(--bg-secondary, rgba(0,0,0,0.03))", borderRadius: 8 }}>
                <div className="flex items-center gap-8 text-base">
                  <span
                    className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`}
                  />
                  <span className="font-semibold">{e.title || e.type}</span>
                  <span className="badge text-xs">{e.type}</span>
                  <StatusBadge status={e.reviewStatus} className="text-xs" />
                  <span className="muted text-xs" style={{ marginLeft: "auto" }}>
                    {relativeTime(e.createdAt)}
                  </span>
                </div>
                {canReview && (e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW") && (
                  <div className="flex gap-8 items-center mt-8">
                    <input
                      placeholder={t("Review comment (optional)")}
                      value={reviewComment}
                      onChange={(ev) => setReviewComment(ev.target.value)}
                      style={{ flex: 1, fontSize: 13 }}
                    />
                    <button
                      className="button text-xs"
                      style={{ padding: "6px 14px" }}
                      disabled={busy}
                      onClick={() => reviewEvidence(e.id, "APPROVED")}
                    >
                      {t("Approve")}
                    </button>
                    <button
                      className="button-secondary text-xs"
                      style={{ padding: "6px 14px" }}
                      disabled={busy}
                      onClick={() => reviewEvidence(e.id, "REJECTED")}
                    >
                      {t("Reject")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted text-sm">{t("No evidence submitted yet.")}</p>
        )}
      </div>

      {/* PoB Records */}
      {task.pobRecords.length > 0 && (
        <div className="card-glass p-18 reveal reveal-delay-3">
          <h3 className="mt-0 mb-12">{t("PoB Records")} ({task.pobRecords.length})</h3>
          <div className="flex-col gap-8">
            {task.pobRecords.map((p) => (
              <Link key={p.id} href={`/dashboard/pob/${p.id}`} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${p.status === "EFFECTIVE" || p.status === "APPROVED" ? "status-dot-green" : p.status === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{p.businessType}</span>
                <span className="badge text-xs">{t("Score:")} {p.score}</span>
                <StatusBadge status={p.status} className="text-xs" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Agent Runs */}
      {task.agentRuns.length > 0 && (
        <div className="card-glass p-18 reveal reveal-delay-3">
          <h3 className="mt-0 mb-12">{t("Agent Runs")} ({task.agentRuns.length})</h3>
          <div className="flex-col gap-8">
            {task.agentRuns.map((r) => (
              <div key={r.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${r.status === "SUCCESS" ? "status-dot-green" : r.status === "FAILED" ? "status-dot-red" : "status-dot-amber"}`} />
                <StatusBadge status={r.status} className="text-xs" />
                {r.cost != null && <span className="muted text-xs">${r.cost.toFixed(4)}</span>}
                <span className="muted text-xs">{relativeTime(r.startedAt)}</span>
                {r.finishedAt && (
                  <span className="muted text-xs">
                    → {relativeTime(r.finishedAt)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
