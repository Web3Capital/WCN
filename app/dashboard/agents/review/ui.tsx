"use client";

import { useState } from "react";
import Link from "next/link";

type PendingRun = {
  id: string; status: string; outputType: string | null; outputs: any; inputs: any;
  tokenCount: number | null; cost: number | null; modelId: string | null;
  startedAt: string; finishedAt: string | null;
  agent: { id: string; name: string; type: string };
  task: { id: string; title: string } | null;
};

type ReviewedRun = {
  id: string; reviewStatus: string; outputType: string | null; cost: number | null;
  finishedAt: string | null;
  agent: { id: string; name: string; type: string };
  reviewedBy: { name: string | null } | null;
};

const REVIEW_COLORS: Record<string, string> = {
  APPROVED: "badge-green", MODIFIED: "", REJECTED: "badge-red",
};

export function ReviewQueueUI({ pendingRuns, recentReviewed }: { pendingRuns: PendingRun[]; recentReviewed: ReviewedRun[] }) {
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function submitReview(runId: string, reviewStatus: string, reviewNotes?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/runs/${runId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus, reviewNotes }),
      });
      if (res.ok) window.location.reload();
    } catch { /* ignore */ }
    setBusy(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Agent Review Queue</h1>
          <p className="muted" style={{ fontSize: 13 }}>{pendingRuns.length} outputs awaiting review</p>
        </div>
        <Link href="/dashboard/agents" className="button" style={{ fontSize: 12, padding: "6px 14px" }}>
          &larr; All Agents
        </Link>
      </div>

      {pendingRuns.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p className="muted">No pending reviews. All agent outputs have been processed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pendingRuns.map((run) => {
            const isExpanded = expandedId === run.id;
            return (
              <div key={run.id} className="card" style={{ padding: 16, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Link href={`/dashboard/agents/${run.agent.id}`} style={{ fontWeight: 600, color: "var(--accent)", fontSize: 14 }}>
                      {run.agent.name}
                    </Link>
                    <span className="badge" style={{ fontSize: 10 }}>{run.agent.type}</span>
                    {run.outputType && <span className="badge" style={{ fontSize: 10 }}>{run.outputType}</span>}
                    <span className="muted" style={{ fontSize: 11 }}>
                      {run.tokenCount ?? 0} tokens | ${run.cost?.toFixed(4) ?? "0"} | {run.modelId ?? "unknown"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="button" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => setExpandedId(isExpanded ? null : run.id)}>
                      {isExpanded ? "Collapse" : "View Output"}
                    </button>
                    <button className="button" style={{ fontSize: 10, padding: "3px 10px", background: "var(--green, #22c55e)", color: "#fff" }} disabled={busy} onClick={() => submitReview(run.id, "APPROVED")}>
                      Approve
                    </button>
                    <button className="button" style={{ fontSize: 10, padding: "3px 10px", background: "var(--red)", color: "#fff" }} disabled={busy} onClick={() => submitReview(run.id, "REJECTED")}>
                      Reject
                    </button>
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "Running..."}
                  {run.task && <> | Task: <Link href={`/dashboard/tasks/${run.task.id}`} style={{ color: "var(--accent)" }}>{run.task.title}</Link></>}
                </div>
                {isExpanded && run.outputs && (
                  <pre style={{ marginTop: 10, padding: 12, borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11, overflow: "auto", maxHeight: 400, whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(run.outputs, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {recentReviewed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recently Reviewed</h2>
          <table className="data-table">
            <thead><tr><th>Agent</th><th>Type</th><th>Output</th><th>Status</th><th>Reviewer</th><th>Cost</th><th>Date</th></tr></thead>
            <tbody>
              {recentReviewed.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/dashboard/agents/${r.agent.id}`} style={{ color: "var(--accent)" }}>{r.agent.name}</Link></td>
                  <td className="muted">{r.agent.type}</td>
                  <td><span className="badge" style={{ fontSize: 10 }}>{r.outputType ?? "—"}</span></td>
                  <td><span className={`badge ${REVIEW_COLORS[r.reviewStatus] ?? ""}`} style={{ fontSize: 10 }}>{r.reviewStatus}</span></td>
                  <td className="muted">{r.reviewedBy?.name ?? "—"}</td>
                  <td className="muted">${r.cost?.toFixed(4) ?? "0"}</td>
                  <td className="muted" style={{ fontSize: 11 }}>{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
