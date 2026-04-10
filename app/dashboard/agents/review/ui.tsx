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

const AGENT_TYPES = ["ALL", "RESEARCH", "DEAL", "EXECUTION", "GROWTH"] as const;
const REVIEW_PAGE_SIZE = 10;

export function ReviewQueueUI({ pendingRuns: initialPending, recentReviewed: initialReviewed }: { pendingRuns: PendingRun[]; recentReviewed: ReviewedRun[] }) {
  const [pendingRuns] = useState(initialPending);
  const [recentReviewed] = useState(initialReviewed);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [rejectNoteId, setRejectNoteId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [page, setPage] = useState(0);

  const filteredPending = typeFilter === "ALL" ? pendingRuns : pendingRuns.filter((r) => r.agent.type === typeFilter);
  const totalPages = Math.ceil(filteredPending.length / REVIEW_PAGE_SIZE);
  const pagedPending = filteredPending.slice(page * REVIEW_PAGE_SIZE, (page + 1) * REVIEW_PAGE_SIZE);

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

      <div className="page-toolbar" style={{ marginBottom: 12 }}>
        <div className="chip-group">
          {AGENT_TYPES.map((t) => (
            <button key={t} className={`chip ${typeFilter === t ? "chip-active" : ""}`} onClick={() => { setTypeFilter(t); setPage(0); }}>
              {t === "ALL" ? `All (${pendingRuns.length})` : t}
            </button>
          ))}
        </div>
      </div>

      {pagedPending.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p className="muted">No pending reviews. All agent outputs have been processed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pagedPending.map((run) => {
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
                    <button className="button" style={{ fontSize: 10, padding: "3px 10px", background: "var(--red)", color: "#fff" }} disabled={busy} onClick={() => { setRejectNoteId(rejectNoteId === run.id ? null : run.id); setRejectNote(""); }}>
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
                {rejectNoteId === run.id && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <textarea
                      autoFocus
                      placeholder="Rejection reason (optional)"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={2}
                      style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }}
                    />
                    <button
                      className="button"
                      style={{ fontSize: 11, padding: "6px 14px", background: "var(--red)", color: "#fff" }}
                      disabled={busy}
                      onClick={() => { submitReview(run.id, "REJECTED", rejectNote || undefined); setRejectNoteId(null); }}
                    >
                      Confirm Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted" style={{ fontSize: 12, lineHeight: "28px" }}>Page {page + 1} of {totalPages}</span>
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next →</button>
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
