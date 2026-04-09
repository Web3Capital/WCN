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

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Review: {node.name}</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Status: <span className="badge" style={{ fontSize: 10 }}>{node.status}</span> |
        Type: <span className="badge" style={{ fontSize: 10 }}>{node.type}</span>
      </p>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Submit Review</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Decision</label>
            <select value={decision} onChange={(e) => setDecision(e.target.value)} style={{ width: "100%" }}>
              {DECISIONS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%" }} />
          </div>
          {error && <p style={{ color: "var(--red)", margin: 0, fontSize: 13 }}>{error}</p>}
          {success && <p style={{ color: "var(--green)", margin: 0, fontSize: 13 }}>{success}</p>}
          <button type="submit" className="button" disabled={busy} style={{ justifySelf: "start" }}>
            {busy ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Review History ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No reviews yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span className={`badge ${r.decision === "APPROVE" ? "badge-green" : r.decision === "REJECT" ? "badge-red" : "badge-yellow"}`} style={{ fontSize: 10 }}>
                    {r.decision}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    by {r.reviewer?.name ?? r.reviewer?.email ?? "Unknown"} — {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                {r.notes && <p style={{ margin: 0, fontSize: 13 }}>{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
