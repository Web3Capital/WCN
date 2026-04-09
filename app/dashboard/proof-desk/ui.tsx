"use client";

import { useState } from "react";
import Link from "next/link";

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
  if (hours <= 0) return <span className="badge badge-red" style={{ fontSize: 10 }}>OVERDUE</span>;
  if (hours <= 24) return <span className="badge badge-amber" style={{ fontSize: 10 }}>{hours}h left</span>;
  return <span className="badge" style={{ fontSize: 10 }}>{Math.round(hours / 24)}d left</span>;
}

export function ProofDeskConsole({ evidences, reviewQueue, isAdmin, isReviewer }: {
  evidences: EvidenceRow[];
  reviewQueue: EvidenceRow[];
  isAdmin: boolean;
  isReviewer: boolean;
}) {
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
    window.location.reload();
  }

  return (
    <div style={{ marginTop: 20 }}>
      {isReviewer && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button className={tab === "queue" ? "button" : "button-secondary"} onClick={() => setTab("queue")}>
            Reviewer Queue ({reviewQueue.length})
          </button>
          <button className={tab === "all" ? "button" : "button-secondary"} onClick={() => setTab("all")}>
            All Evidence ({evidences.length})
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {["ALL", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DISPUTED"].map((s) => (
          <button key={s} className={filter === s ? "button" : "button-secondary"} style={{ fontSize: 12 }} onClick={() => setFilter(s)}>
            {s === "ALL" ? `All (${displayed.length})` : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="apps-list">
        {filtered.map((e) => (
          <div key={e.id} className="apps-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" || e.reviewStatus === "DISPUTED" ? "status-dot-red" : e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW" ? "status-dot-amber" : ""}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{e.title || e.type}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {e.node?.name ?? "—"}
                {e.task ? ` · Task: ${e.task.title}` : ""}
                {e.deal ? ` · Deal: ${e.deal.title}` : ""}
                {e.project ? ` · ${e.project.name}` : ""}
              </div>
            </div>
            <SlaTag deadline={e.slaDeadlineAt} />
            <span className={`badge ${STATUS_COLOR[e.reviewStatus] ?? ""}`}>{e.reviewStatus}</span>
            <span className="muted" style={{ fontSize: 11 }}>{new Date(e.createdAt).toLocaleDateString()}</span>

            {isReviewer && (e.reviewStatus === "SUBMITTED" || e.reviewStatus === "UNDER_REVIEW") && (
              <div style={{ display: "flex", gap: 4 }}>
                {e.reviewStatus === "SUBMITTED" && (
                  <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => reviewAction(e.id, "UNDER_REVIEW")}>Review</button>
                )}
                <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px", color: "var(--green)" }} onClick={() => reviewAction(e.id, "APPROVED")}>Approve</button>
                <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px", color: "var(--red)" }} onClick={() => reviewAction(e.id, "REJECTED")}>Reject</button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="muted" style={{ padding: 20, textAlign: "center" }}>No evidence found.</p>}
      </div>
    </div>
  );
}
