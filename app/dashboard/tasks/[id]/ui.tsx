"use client";

import { useState } from "react";
import Link from "next/link";

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
const STATUS_COLOR: Record<string, string> = {
  CLOSED: "badge-green", ACCEPTED: "badge-green",
  CANCELLED: "badge-red", BLOCKED: "badge-red",
  REWORK: "badge-amber", IN_PROGRESS: "badge-amber", SUBMITTED: "badge-purple",
};

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

export function TaskDetail({ task, isAdmin }: { task: TaskData; isAdmin: boolean }) {
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
  const canReview = isAdmin && ["SUBMITTED", "WAITING_REVIEW"].includes(status);
  const actions = NEXT_STATUS[status] ?? [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">Task</span>
        <span className={`badge ${STATUS_COLOR[status] ?? ""}`}>{status}</span>
        <span className="badge">{task.type}</span>
      </div>
      <h1 style={{ marginTop: 4 }}>{task.title}</h1>
      <p className="muted" style={{ margin: "4px 0 0" }}>
        {task.ownerNode ? <>Node: <Link href={`/dashboard/nodes/${task.ownerNode.id}`} style={{ color: "var(--accent)" }}>{task.ownerNode.name}</Link></> : null}
        {task.project ? <> · Project: <Link href={`/dashboard/projects/${task.project.id}`} style={{ color: "var(--accent)" }}>{task.project.name}</Link></> : null}
        {task.deal ? <> · Deal: <Link href={`/dashboard/deals/${task.deal.id}`} style={{ color: "var(--accent)" }}>{task.deal.title}</Link></> : null}
        {task.dueAt ? <> · Due: {new Date(task.dueAt).toLocaleDateString()}</> : null}
      </p>

      {task.description && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Description</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{task.description}</p>
        </div>
      )}

      {/* Workflow Actions */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>Actions</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
            <button className="button-secondary" style={{ fontSize: 12, opacity: 0.6 }} disabled={busy} onClick={() => transition("CANCELLED")}>
              Cancel
            </button>
          )}
        </div>
        {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
      </div>

      {/* Submit Output Modal */}
      {showSubmit && (
        <div className="card" style={{ padding: 20, marginTop: 16, border: "2px solid var(--accent)" }}>
          <h3 style={{ margin: "0 0 12px" }}>Submit Task Output</h3>
          <div className="form" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Evidence Title</span>
              <input
                value={submitForm.title}
                onChange={(e) => setSubmitForm((s) => ({ ...s, title: e.target.value }))}
                placeholder={`Output: ${task.title}`}
              />
            </label>
            <div className="grid-2" style={{ gap: 12 }}>
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
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button" disabled={busy || !submitForm.summary.trim()} onClick={submitOutput}>
                {busy ? "Submitting..." : "Submit Output"}
              </button>
              <button className="button-secondary" onClick={() => setShowSubmit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 16, gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Assignments</h3>
          {task.assignments.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              {task.assignments.map((a) => (
                <Link key={a.id} href={`/dashboard/nodes/${a.node.id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span className="status-dot status-dot-accent" />
                  <span style={{ fontWeight: 600 }}>{a.node.name}</span>
                </Link>
              ))}
            </div>
          ) : <p className="muted">No assignments.</p>}
          {task.acceptanceOwner && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Acceptance: {task.acceptanceOwner}</p>}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Requirements</h3>
          {task.evidenceRequired.length > 0 ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {task.evidenceRequired.map((e) => <span key={e} className="badge badge-amber" style={{ fontSize: 11 }}>{e}</span>)}
            </div>
          ) : <p className="muted">No specific evidence requirements.</p>}
        </div>
      </div>

      {/* Evidence with Review */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>Evidence ({evidences.length})</h3>
        {evidences.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {evidences.map((e) => (
              <div key={e.id} style={{ padding: 12, background: "var(--bg-secondary, rgba(0,0,0,0.03))", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                  <span style={{ fontWeight: 600 }}>{e.title || e.type}</span>
                  <span className="badge" style={{ fontSize: 11 }}>{e.type}</span>
                  <span className={`badge ${e.reviewStatus === "APPROVED" ? "badge-green" : e.reviewStatus === "REJECTED" ? "badge-red" : "badge-amber"}`} style={{ fontSize: 11 }}>{e.reviewStatus}</span>
                  <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
                {canReview && (e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW") && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      placeholder="Review comment (optional)"
                      value={reviewComment}
                      onChange={(ev) => setReviewComment(ev.target.value)}
                      style={{ flex: 1, fontSize: 13 }}
                    />
                    <button className="button" style={{ fontSize: 12, padding: "6px 14px" }} disabled={busy} onClick={() => reviewEvidence(e.id, "APPROVED")}>
                      Approve
                    </button>
                    <button className="button-secondary" style={{ fontSize: 12, padding: "6px 14px" }} disabled={busy} onClick={() => reviewEvidence(e.id, "REJECTED")}>
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
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>PoB Records ({task.pobRecords.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {task.pobRecords.map((p) => (
              <Link key={p.id} href={`/dashboard/pob/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${p.status === "APPROVED" ? "status-dot-green" : "status-dot-amber"}`} />
                <span>{p.businessType}</span>
                <span className="badge" style={{ fontSize: 11 }}>{p.status}</span>
                <span className="muted" style={{ fontSize: 11 }}>Score: {p.score}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {task.agentRuns.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Agent Runs ({task.agentRuns.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {task.agentRuns.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${r.status === "SUCCESS" ? "status-dot-green" : r.status === "FAILED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="badge" style={{ fontSize: 11 }}>{r.status}</span>
                {r.cost != null && <span className="muted" style={{ fontSize: 11 }}>${r.cost.toFixed(4)}</span>}
                <span className="muted" style={{ fontSize: 11 }}>{new Date(r.startedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
