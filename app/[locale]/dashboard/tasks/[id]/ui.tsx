"use client";

import { useState } from "react";
import Link from "next/link";
import { DetailLayout, StatusBadge } from "../../_components";

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
  project: { id: string; name: string; status: string } | null;
  ownerNode: { id: string; name: string } | null;
  deal: { id: string; title: string; stage: string } | null;
  assignments: { id: string; node: { id: string; name: string } }[];
  evidences: { id: string; title: string | null; type: string; reviewStatus: string; createdAt: string }[];
  pobRecords: { id: string; businessType: string; status: string; score: number }[];
  agentRuns: { id: string; status: string; cost: number | null; startedAt: string; finishedAt: string | null }[];
};

const EVIDENCE_TYPES = ["CONTRACT", "TRANSFER", "REPORT", "SCREENSHOT", "LINK", "ONCHAIN_TX", "OTHER"] as const;

const NEXT_STATUS: Record<string, { label: string; target: string; style?: string }[]> = {
  DRAFT: [{ label: "Assign", target: "ASSIGNED" }],
  ASSIGNED: [{ label: "Start Work", target: "IN_PROGRESS" }],
  IN_PROGRESS: [{ label: "Submit for Review", target: "SUBMITTED", style: "button" }, { label: "Block", target: "BLOCKED" }],
  SUBMITTED: [{ label: "Approve", target: "ACCEPTED", style: "button" }, { label: "Request Rework", target: "REWORK" }],
  ACCEPTED: [{ label: "Close", target: "CLOSED", style: "button" }],
  REWORK: [{ label: "Resume Work", target: "IN_PROGRESS" }],
  BLOCKED: [{ label: "Unblock", target: "IN_PROGRESS" }],
  OPEN: [{ label: "Assign", target: "ASSIGNED" }, { label: "Start Work", target: "IN_PROGRESS" }],
  WAITING_REVIEW: [{ label: "Approve", target: "ACCEPTED", style: "button" }, { label: "Request Rework", target: "REWORK" }],
  DONE: [{ label: "Close", target: "CLOSED" }],
};

export function TaskDetail({ task, isAdmin, canReviewEvidence = false }: { task: TaskData; isAdmin: boolean; canReviewEvidence?: boolean }) {
  const [status, setStatus] = useState(task.status);
  const [evidences, setEvidences] = useState(task.evidences);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: "", type: "REPORT" as string, summary: "", url: "" });
  const [reviewComment, setReviewComment] = useState("");

  async function transition(s: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      const data = await res.json();
      if (data.ok) setStatus(s);
      else setError(data.error || "Transition failed.");
    } finally { setBusy(false); }
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
      if (!evData?.ok) throw new Error(evData?.error ?? "Evidence creation failed.");

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
      setError(e?.message ?? "Submit failed.");
    } finally { setBusy(false); }
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
        setEvidences((prev) => prev.map((e) => e.id === evidenceId ? { ...e, reviewStatus: decision } : e));
        setReviewComment("");
      } else {
        setError(data?.error ?? "Review failed.");
      }
    } finally { setBusy(false); }
  }

  const canSubmitOutput = ["IN_PROGRESS", "REWORK"].includes(status);
  const canReview = (isAdmin || canReviewEvidence) && ["SUBMITTED", "WAITING_REVIEW"].includes(status);
  const actions = NEXT_STATUS[status] ?? [];

  return (
    <DetailLayout
      backHref="/dashboard/tasks"
      backLabel="All Tasks"
      title={task.title}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          <span className="badge">{task.type}</span>
        </span>
      }
      meta={
        <>
          {task.ownerNode && <span>Node: <Link href={`/dashboard/nodes/${task.ownerNode.id}`} style={{ color: "var(--accent)" }}>{task.ownerNode.name}</Link></span>}
          {task.project && <span>Project: <Link href={`/dashboard/projects/${task.project.id}`} style={{ color: "var(--accent)" }}>{task.project.name}</Link></span>}
          {task.deal && <span>Deal: <Link href={`/dashboard/deals/${task.deal.id}`} style={{ color: "var(--accent)" }}>{task.deal.title}</Link></span>}
          {task.dueAt && <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>}
        </>
      }
    >
      {task.description && (
        <div className="card p-18">
          <h3 className="mt-0 mb-8">Description</h3>
          <p className="mt-0 mb-0" style={{ whiteSpace: "pre-wrap" }}>{task.description}</p>
        </div>
      )}

      <div className="card p-18">
        <h3 className="mt-0 mb-12">Actions</h3>
        <div className="flex flex-wrap gap-8 items-center">
          {actions.map((a) => (
            <button
              key={a.target}
              className={a.style === "button" ? "button" : "button-secondary"}
              style={{ fontSize: 13 }}
              disabled={busy}
              onClick={() => transition(a.target)}
            >
              {a.label}
            </button>
          ))}
          {canSubmitOutput && (
            <button className="button" style={{ fontSize: 13 }} disabled={busy} onClick={() => setShowSubmit(true)}>
              Submit Output + Evidence
            </button>
          )}
          {status !== "CANCELLED" && status !== "CLOSED" && (
            <button className="button-secondary text-xs" style={{ opacity: 0.6 }} disabled={busy} onClick={() => transition("CANCELLED")}>
              Cancel
            </button>
          )}
        </div>
        {error && <p className="form-error mt-8">{error}</p>}
      </div>

      {showSubmit && (
        <div className="card p-20" style={{ border: "2px solid var(--accent)" }}>
          <h3 className="mt-0 mb-12">Submit Task Output</h3>
          <div className="form" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Evidence Title</span>
              <input
                value={submitForm.title}
                onChange={(e) => setSubmitForm((s) => ({ ...s, title: e.target.value }))}
                placeholder={`Output: ${task.title}`}
              />
            </label>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">Evidence Type</span>
                <select value={submitForm.type} onChange={(e) => setSubmitForm((s) => ({ ...s, type: e.target.value }))}>
                  {EVIDENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">URL (optional)</span>
                <input
                  value={submitForm.url}
                  onChange={(e) => setSubmitForm((s) => ({ ...s, url: e.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </div>
            <label className="field">
              <span className="label">Summary</span>
              <textarea
                value={submitForm.summary}
                onChange={(e) => setSubmitForm((s) => ({ ...s, summary: e.target.value }))}
                placeholder="Describe the work completed and deliverables..."
                style={{ minHeight: 80 }}
              />
            </label>
            <div className="flex gap-8">
              <button className="button" disabled={busy || !submitForm.summary.trim()} onClick={submitOutput}>
                {busy ? "Submitting..." : "Submit Output"}
              </button>
              <button className="button-secondary" onClick={() => setShowSubmit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2 gap-16">
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Assignments</h3>
          {task.assignments.length > 0 ? (
            <div className="flex-col gap-8">
              {task.assignments.map((a) => (
                <Link key={a.id} href={`/dashboard/nodes/${a.node.id}`} className="flex items-center gap-8 text-base">
                  <span className="status-dot status-dot-accent" />
                  <span className="font-semibold">{a.node.name}</span>
                </Link>
              ))}
            </div>
          ) : <p className="muted">No assignments.</p>}
          {task.acceptanceOwner && <p className="muted text-sm mt-8">Acceptance: {task.acceptanceOwner}</p>}
        </div>

        <div className="card p-18">
          <h3 className="mt-0 mb-12">Requirements</h3>
          {task.evidenceRequired.length > 0 ? (
            <div className="flex flex-wrap gap-6">
              {task.evidenceRequired.map((e) => <span key={e} className="badge badge-amber text-xs">{e}</span>)}
            </div>
          ) : <p className="muted">No specific evidence requirements.</p>}
        </div>
      </div>

      <div className="card p-18">
        <h3 className="mt-0 mb-12">Evidence ({evidences.length})</h3>
        {evidences.length > 0 ? (
          <div className="flex-col gap-12">
            {evidences.map((e) => (
              <div key={e.id} style={{ padding: 12, background: "var(--bg-secondary, rgba(0,0,0,0.03))", borderRadius: 8 }}>
                <div className="flex items-center gap-8 text-base">
                  <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                  <span className="font-semibold">{e.title || e.type}</span>
                  <span className="badge text-xs">{e.type}</span>
                  <StatusBadge status={e.reviewStatus} className="text-xs" />
                  <span className="muted text-xs" style={{ marginLeft: "auto" }}>{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
                {canReview && (e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW") && (
                  <div className="flex gap-8 items-center mt-8">
                    <input
                      placeholder="Review comment (optional)"
                      value={reviewComment}
                      onChange={(ev) => setReviewComment(ev.target.value)}
                      style={{ flex: 1, fontSize: 13 }}
                    />
                    <button className="button text-xs" style={{ padding: "6px 14px" }} disabled={busy} onClick={() => reviewEvidence(e.id, "APPROVED")}>
                      Approve
                    </button>
                    <button className="button-secondary text-xs" style={{ padding: "6px 14px" }} disabled={busy} onClick={() => reviewEvidence(e.id, "REJECTED")}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="muted">No evidence submitted yet.</p>}
      </div>

      {task.pobRecords.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">PoB Records ({task.pobRecords.length})</h3>
          <div className="flex-col gap-8">
            {task.pobRecords.map((p) => (
              <Link key={p.id} href={`/dashboard/pob/${p.id}`} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${p.status === "APPROVED" ? "status-dot-green" : "status-dot-amber"}`} />
                <span>{p.businessType}</span>
                <StatusBadge status={p.status} className="text-xs" />
                <span className="muted text-xs">Score: {p.score}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {task.agentRuns.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Agent Runs ({task.agentRuns.length})</h3>
          <div className="flex-col gap-8">
            {task.agentRuns.map((r) => (
              <div key={r.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${r.status === "SUCCESS" ? "status-dot-green" : r.status === "FAILED" ? "status-dot-red" : "status-dot-amber"}`} />
                <StatusBadge status={r.status} className="text-xs" />
                {r.cost != null && <span className="muted text-xs">${r.cost.toFixed(4)}</span>}
                <span className="muted text-xs">{new Date(r.startedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
