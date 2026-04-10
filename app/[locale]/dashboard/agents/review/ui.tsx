"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, FilterToolbar, EmptyState } from "../../_components";

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
      <div className="flex-between items-center mb-20">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Agent Review Queue</h1>
          <p className="muted text-sm">{pendingRuns.length} outputs awaiting review</p>
        </div>
        <Link href="/dashboard/agents" className="button" style={{ fontSize: 12, padding: "6px 14px" }}>
          &larr; All Agents
        </Link>
      </div>

      <FilterToolbar
        filters={AGENT_TYPES}
        active={typeFilter}
        onChange={(t) => { setTypeFilter(t); setPage(0); }}
        totalCount={pendingRuns.length}
      />

      {pagedPending.length === 0 ? (
        <EmptyState message="No pending reviews. All agent outputs have been processed." />
      ) : (
        <div className="flex-col gap-12">
          {pagedPending.map((run) => {
            const isExpanded = expandedId === run.id;
            return (
              <div key={run.id} className="card p-16" style={{ border: "1px solid var(--border)" }}>
                <div className="flex-between items-center flex-wrap gap-8">
                  <div className="flex flex-wrap items-center gap-8">
                    <Link href={`/dashboard/agents/${run.agent.id}`} className="font-semibold" style={{ color: "var(--accent)", fontSize: 14 }}>
                      {run.agent.name}
                    </Link>
                    <span className="badge text-xs">{run.agent.type}</span>
                    {run.outputType && <span className="badge text-xs">{run.outputType}</span>}
                    <span className="muted text-xs">
                      {run.tokenCount ?? 0} tokens | ${run.cost?.toFixed(4) ?? "0"} | {run.modelId ?? "unknown"}
                    </span>
                  </div>
                  <div className="flex gap-6">
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
                <div className="muted text-xs mt-4">
                  {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "Running..."}
                  {run.task && <> | Task: <Link href={`/dashboard/tasks/${run.task.id}`} style={{ color: "var(--accent)" }}>{run.task.title}</Link></>}
                </div>
                {isExpanded && run.outputs && (
                  <pre className="mt-10" style={{ padding: 12, borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11, overflow: "auto", maxHeight: 400, whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(run.outputs, null, 2)}
                  </pre>
                )}
                {rejectNoteId === run.id && (
                  <div className="flex mt-10 gap-8" style={{ alignItems: "flex-end" }}>
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
        <div className="flex-center gap-8 mt-12">
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted" style={{ fontSize: 12, lineHeight: "28px" }}>Page {page + 1} of {totalPages}</span>
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {recentReviewed.length > 0 && (
        <div className="mt-20">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recently Reviewed</h2>
          <table className="data-table">
            <thead><tr><th>Agent</th><th>Type</th><th>Output</th><th>Status</th><th>Reviewer</th><th>Cost</th><th>Date</th></tr></thead>
            <tbody>
              {recentReviewed.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/dashboard/agents/${r.agent.id}`} style={{ color: "var(--accent)" }}>{r.agent.name}</Link></td>
                  <td className="muted">{r.agent.type}</td>
                  <td><span className="badge text-xs">{r.outputType ?? "—"}</span></td>
                  <td><StatusBadge status={r.reviewStatus} /></td>
                  <td className="muted">{r.reviewedBy?.name ?? "—"}</td>
                  <td className="muted">${r.cost?.toFixed(4) ?? "0"}</td>
                  <td className="muted text-xs">{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
