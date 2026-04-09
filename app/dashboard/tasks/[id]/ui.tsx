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

const STATUSES = [
  "DRAFT", "ASSIGNED", "IN_PROGRESS", "SUBMITTED",
  "ACCEPTED", "REWORK", "BLOCKED", "CANCELLED", "CLOSED",
];
const STATUS_COLOR: Record<string, string> = {
  CLOSED: "badge-green", ACCEPTED: "badge-green",
  CANCELLED: "badge-red", BLOCKED: "badge-red",
  REWORK: "badge-amber", IN_PROGRESS: "badge-amber", SUBMITTED: "badge-purple",
};

export function TaskDetail({ task, isAdmin }: { task: TaskData; isAdmin: boolean }) {
  const [status, setStatus] = useState(task.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Status Transition</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUSES.map((s) => (
              <button key={s} className="button-secondary" style={{ fontSize: 12 }} disabled={busy || s === status} onClick={() => transition(s)}>
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {task.evidences.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Evidence ({task.evidences.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {task.evidences.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span>{e.title || e.type}</span>
                <span className="badge" style={{ fontSize: 11 }}>{e.reviewStatus}</span>
                <span className="muted" style={{ fontSize: 11 }}>{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
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
