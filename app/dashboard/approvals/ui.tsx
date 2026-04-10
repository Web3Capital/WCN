"use client";

import { useEffect, useState } from "react";
import { StatusBadge, FilterToolbar, EmptyState, LoadingState } from "../_components";

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
      .then((d) => { if (d.ok) setApprovals(d.data ?? []); })
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
      <FilterToolbar filters={FILTERS} active={filter} onChange={setFilter} />

      {loading ? (
        <LoadingState />
      ) : approvals.length === 0 ? (
        <EmptyState message={`No ${filter.toLowerCase()} approvals.`} />
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
                <td><StatusBadge status={a.status} /></td>
                <td><span className="badge text-xs">{a.actionType}</span></td>
                <td>
                  <div className="text-sm font-semibold">{a.entityType}</div>
                  <div className="muted text-xs">#{a.entityId.slice(0, 8)}</div>
                </td>
                <td className="muted text-xs">{a.reason || "—"}</td>
                <td className="muted text-xs">
                  {new Date(a.createdAt).toLocaleString()}
                  {a.decidedAt && <div>Decided: {new Date(a.decidedAt).toLocaleString()}</div>}
                </td>
                <td>
                  {a.status === "PENDING" && (
                    <div className="flex gap-4">
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
