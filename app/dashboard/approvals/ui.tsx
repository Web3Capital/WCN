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
  PENDING: "",
  APPROVED: "badge-green",
  REJECTED: "badge-red",
  EXPIRED: "badge-yellow",
};

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Approval Queue</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {["PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              className={`badge ${filter === s ? "badge-green" : ""}`}
              onClick={() => setFilter(s)}
              style={{ cursor: "pointer", fontSize: 11, padding: "4px 10px" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : approvals.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p className="muted">No {filter.toLowerCase()} approvals.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {approvals.map((a) => (
            <div key={a.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span className={`badge ${STATUS_COLORS[a.status] ?? ""}`} style={{ fontSize: 10 }}>{a.status}</span>
                    <span className="badge" style={{ fontSize: 10 }}>{a.actionType}</span>
                  </div>
                  <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14 }}>
                    {a.entityType} #{a.entityId.slice(0, 8)}
                  </p>
                  {a.reason && <p className="muted" style={{ margin: 0, fontSize: 12 }}>{a.reason}</p>}
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 11 }}>
                    Requested: {new Date(a.createdAt).toLocaleString()}
                    {a.decidedAt && ` | Decided: ${new Date(a.decidedAt).toLocaleString()}`}
                  </p>
                </div>
                {a.status === "PENDING" && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      className="button"
                      style={{ fontSize: 11, padding: "4px 12px" }}
                      disabled={busy === a.id}
                      onClick={() => decide(a.id, "APPROVED")}
                    >
                      Approve
                    </button>
                    <button
                      className="button"
                      style={{ fontSize: 11, padding: "4px 12px", background: "var(--red)", color: "#fff" }}
                      disabled={busy === a.id}
                      onClick={() => decide(a.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
