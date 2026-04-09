"use client";

import { useState } from "react";
import Link from "next/link";

type ReviewData = {
  id: string;
  decision: string;
  notes: string | null;
  createdAt: string;
  reviewer: { name: string | null; email: string | null } | null;
};

type NodeData = {
  id: string;
  name: string;
  status: string;
  type: string;
};

const DECISIONS = ["APPROVE", "REJECT", "NEEDS_CHANGES"] as const;
const DECISION_BADGE: Record<string, string> = {
  APPROVE: "badge-green", REJECT: "badge-red", NEEDS_CHANGES: "badge-yellow",
};

export function NodeReviewUI({ node, reviews }: { node: NodeData; reviews: ReviewData[] }) {
  const [decision, setDecision] = useState<string>("APPROVE");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewDecision: decision, reviewNotes: notes }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error || "Failed.");
      else setSuccess("Review submitted.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/dashboard/nodes/${node.id}`} style={{ fontSize: 13, color: "var(--accent)" }}>
          &larr; Back to {node.name}
        </Link>
      </div>

      <div className="detail-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Review: {node.name}</h1>
          <div className="detail-header-meta">
            <span className="badge">{node.status}</span>
            <span className="badge">{node.type}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Submit Review</h2>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span className="label">Decision</span>
            <select value={decision} onChange={(e) => setDecision(e.target.value)}>
              {DECISIONS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p style={{ color: "var(--green)", margin: 0, fontSize: 13 }} role="status">{success}</p>}
          <button type="submit" className="button" disabled={busy} style={{ justifySelf: "start" }}>
            {busy ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Review History ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="empty-state"><p>No reviews yet.</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Decision</th><th>Reviewer</th><th>Date</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td><span className={`badge ${DECISION_BADGE[r.decision] ?? ""}`}>{r.decision}</span></td>
                  <td style={{ fontSize: 12 }}>{r.reviewer?.name ?? r.reviewer?.email ?? "Unknown"}</td>
                  <td className="muted" style={{ fontSize: 11 }}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td style={{ fontSize: 13 }}>{r.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
