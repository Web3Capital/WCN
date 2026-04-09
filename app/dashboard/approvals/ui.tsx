"use client";

import { useEffect, useState } from "react";

type Approval = {
  id: string;
  entityType: string;
  entityId: string;
  actionType: string;
  requestedById: string;
  approvedById: string | null;
  rejectedById: string | null;
  status: string;
  reason: string | null;
  createdAt: string;
  decidedAt: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-amber", APPROVED: "badge-green", REJECTED: "badge-red", EXPIRED: "badge-yellow",
};

const FILTERS = ["PENDING", "APPROVED", "REJECTED"] as const;

export function ApprovalsUI() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/approvals?status=${filter}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setApprovals(d.approvals); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setBusy(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (data.ok) {
        setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: decision, decidedAt: new Date().toISOString() } : a)));
      }
    } catch { /* ignore */ }
    setBusy(null);
  }

  return (
    <div>
      <div className="page-toolbar" style={{ marginBottom: 20 }}>
        <div className="chip-group">
          {FILTERS.map((s) => (
            <button key={s} className={`chip ${filter === s ? "chip-active" : ""}`} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : approvals.length === 0 ? (
        <div className="empty-state card"><p>No {filter.toLowerCase()} approvals.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Reason</th>
              <th>Requested</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((a) => (
              <tr key={a.id}>
                <td><span className={`badge ${STATUS_COLORS[a.status] ?? ""}`}>{a.status}</span></td>
                <td><span className="badge" style={{ fontSize: 10 }}>{a.actionType}</span></td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.entityType}</div>
                  <div className="muted" style={{ fontSize: 11 }}>#{a.entityId.slice(0, 8)}</div>
                </td>
                <td className="muted" style={{ fontSize: 12 }}>{a.reason || "—"}</td>
                <td className="muted" style={{ fontSize: 11 }}>
                  {new Date(a.createdAt).toLocaleString()}
                  {a.decidedAt && <div>Decided: {new Date(a.decidedAt).toLocaleString()}</div>}
                </td>
                <td>
                  {a.status === "PENDING" && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="button" style={{ fontSize: 11, padding: "4px 12px" }} disabled={busy === a.id} onClick={() => decide(a.id, "APPROVED")}>
                        Approve
                      </button>
                      <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px", color: "var(--red)" }} disabled={busy === a.id} onClick={() => decide(a.id, "REJECTED")}>
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
