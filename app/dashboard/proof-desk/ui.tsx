"use client";

import { useState } from "react";

type EvidenceRow = {
  id: string;
  type: string;
  title: string | null;
  reviewStatus: string;
  slaDeadlineAt: string | null;
  createdAt: string;
  task: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
  node: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "", SUBMITTED: "badge-amber", UNDER_REVIEW: "badge-purple",
  APPROVED: "badge-green", REJECTED: "badge-red", DISPUTED: "badge-red",
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
    <div style={{ marginTop: 20 }}>
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

      <div className="page-toolbar">
        <div className="chip-group">
          {STATUSES.map((s) => (
            <button key={s} className={`chip ${filter === s ? "chip-active" : ""}`} onClick={() => setFilter(s)}>
              {s === "ALL" ? `All (${displayed.length})` : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>No evidence found.</p></div>
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
              <tr key={e.id}>
                <td>
                  <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" || e.reviewStatus === "DISPUTED" ? "status-dot-red" : e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW" ? "status-dot-amber" : ""}`} />
                </td>
                <td style={{ fontWeight: 700, fontSize: 13 }}>{e.title || e.type}</td>
                <td>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {e.node?.name ?? "—"}
                    {e.task ? ` · Task: ${e.task.title}` : ""}
                    {e.deal ? ` · Deal: ${e.deal.title}` : ""}
                  </div>
                </td>
                <td><SlaTag deadline={e.slaDeadlineAt} /></td>
                <td><span className={`badge ${STATUS_COLOR[e.reviewStatus] ?? ""}`}>{e.reviewStatus}</span></td>
                <td className="muted" style={{ fontSize: 11 }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                {isReviewer && (
                  <td>
                    {(e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW") && (
                      <div style={{ display: "flex", gap: 4 }}>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
