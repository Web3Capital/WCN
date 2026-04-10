"use client";

import { useState } from "react";
import { StatusBadge, FilterToolbar, EmptyState } from "../_components";

type EvidenceRow = {
  id: string;
  type: string;
  title: string | null;
  reviewStatus: string;
  slaDeadlineAt: string | null;
  fileUrl: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  completenessScore: number | null;
  createdAt: string;
  task: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
  node: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
};

function SlaTag({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  const hours = Math.round(diff / 3600000);
  if (hours <= 0) return <span className="sla-tag sla-overdue">OVERDUE</span>;
  if (hours <= 24) return <span className="sla-tag" style={{ color: "var(--amber)", borderColor: "color-mix(in oklab, var(--amber) 25%, transparent)" }}>{hours}h left</span>;
  return <span className="sla-tag">{Math.round(hours / 24)}d left</span>;
}

const STATUSES = ["ALL", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DISPUTED"] as const;

export function ProofDeskConsole({ evidences: initialEvidences, reviewQueue: initialQueue, isAdmin, isReviewer }: {
  evidences: EvidenceRow[];
  reviewQueue: EvidenceRow[];
  isAdmin: boolean;
  isReviewer: boolean;
}) {
  const [evidences, setEvidences] = useState(initialEvidences);
  const [reviewQueue, setReviewQueue] = useState(initialQueue);
  const [tab, setTab] = useState<"all" | "queue">(isReviewer ? "queue" : "all");
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayed = tab === "queue" ? reviewQueue : evidences;
  const filtered = filter === "ALL" ? displayed : displayed.filter((e) => e.reviewStatus === filter);

  async function reviewAction(id: string, action: "UNDER_REVIEW" | "APPROVED" | "REJECTED") {
    await fetch(`/api/evidence/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus: action }),
    });
    const update = (items: EvidenceRow[]) =>
      items.map((e) => e.id === id ? { ...e, reviewStatus: action } : e);
    setEvidences(update);
    setReviewQueue(update);
  }

  return (
    <div className="mt-20">
      {isReviewer && (
        <div className="tab-nav">
          <button className={`tab-btn ${tab === "queue" ? "tab-btn-active" : ""}`} onClick={() => setTab("queue")}>
            Reviewer Queue ({reviewQueue.length})
          </button>
          <button className={`tab-btn ${tab === "all" ? "tab-btn-active" : ""}`} onClick={() => setTab("all")}>
            All Evidence ({evidences.length})
          </button>
        </div>
      )}

      <FilterToolbar filters={STATUSES} active={filter} onChange={setFilter} totalCount={displayed.length} />

      {filtered.length === 0 ? (
        <EmptyState message="No evidence found." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Evidence</th>
              <th>Context</th>
              <th>SLA</th>
              <th>Status</th>
              <th>Date</th>
              {isReviewer && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <>
                <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                  <td>
                    <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" || e.reviewStatus === "DISPUTED" ? "status-dot-red" : e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW" ? "status-dot-amber" : ""}`} />
                  </td>
                  <td className="font-bold text-sm">{e.title || e.type}</td>
                  <td>
                    <div className="muted text-xs">
                      {e.node?.name ?? "—"}
                      {e.task ? ` · Task: ${e.task.title}` : ""}
                      {e.deal ? ` · Deal: ${e.deal.title}` : ""}
                    </div>
                  </td>
                  <td><SlaTag deadline={e.slaDeadlineAt} /></td>
                  <td>
                    <StatusBadge status={e.reviewStatus} />
                    {e.completenessScore != null && (
                      <span className="muted" style={{ fontSize: 10, marginLeft: 6 }}>{Math.round(e.completenessScore * 100)}%</span>
                    )}
                  </td>
                  <td className="muted text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                  {isReviewer && (
                    <td>
                      {(e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW") && (
                        <div className="flex gap-4" onClick={(ev) => ev.stopPropagation()}>
                          {e.reviewStatus === "SUBMITTED" && (
                            <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => reviewAction(e.id, "UNDER_REVIEW")}>Review</button>
                          )}
                          <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px", color: "var(--green)" }} onClick={() => reviewAction(e.id, "APPROVED")}>Approve</button>
                          <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px", color: "var(--red)" }} onClick={() => reviewAction(e.id, "REJECTED")}>Reject</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
                {expandedId === e.id && (
                  <tr key={`${e.id}-detail`}>
                    <td></td>
                    <td colSpan={isReviewer ? 6 : 5}>
                      <div className="card p-14" style={{ margin: "4px 0 8px", fontSize: 12 }}>
                        {e.description && <p style={{ margin: "0 0 8px" }}>{e.description}</p>}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div><strong>Type:</strong> {e.type}</div>
                          <div><strong>Project:</strong> {e.project?.name ?? "—"}</div>
                          <div><strong>Node:</strong> {e.node?.name ?? "—"}</div>
                          <div><strong>Deal:</strong> {e.deal?.title ?? "—"}</div>
                          <div><strong>Completeness:</strong> {e.completenessScore != null ? `${Math.round(e.completenessScore * 100)}%` : "N/A"}</div>
                          <div><strong>SLA:</strong> {e.slaDeadlineAt ? new Date(e.slaDeadlineAt).toLocaleString() : "None"}</div>
                        </div>
                        {e.fileUrl && (
                          <div className="mt-8">
                            <a href={e.fileUrl} target="_blank" rel="noopener noreferrer" className="link text-xs">View Attached File &rarr;</a>
                          </div>
                        )}
                        {e.metadata && Object.keys(e.metadata).length > 0 && (
                          <pre className="mt-8" style={{ padding: 8, borderRadius: 4, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 10, overflow: "auto", maxHeight: 150 }}>
                            {JSON.stringify(e.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
