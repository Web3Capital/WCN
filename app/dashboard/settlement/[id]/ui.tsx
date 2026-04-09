"use client";

import { useState } from "react";
import Link from "next/link";

type Line = { id: string; nodeId: string; node: { id: string; name: string }; scoreTotal: number; allocation: number; pobCount: number };
type Approval = { id: string; actionType: string; status: string; requestedById: string; reason: string | null; createdAt: string };
type Cycle = {
  id: string;
  kind: string;
  status: string;
  startAt: string;
  endAt: string;
  pool: number;
  lines: Line[];
  lockedById: string | null;
  exportedById: string | null;
  reopenReason: string | null;
  lockApprovalId: string | null;
  reopenApprovalId: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "",
  RECONCILED: "badge-yellow",
  LOCK_PENDING_APPROVAL: "badge-yellow",
  LOCKED: "badge-green",
  EXPORTED: "badge-green",
  REOPEN_PENDING_APPROVAL: "badge-yellow",
  REOPENED: "",
  FINALIZED: "badge-green",
};

export function SettlementCycleDetailUI({
  cycle,
  pendingApprovals,
  isAdmin,
}: {
  cycle: Cycle;
  pendingApprovals: Approval[];
  isAdmin: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function requestLock() {
    setBusy(true);
    try {
      await fetch(`/api/settlement/cycles/${cycle.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dualControl: true, reason: "Standard period close" }),
      });
      window.location.reload();
    } catch { /* ignore */ }
    setBusy(false);
  }

  async function requestReopen() {
    const reason = prompt("Reopen reason:");
    if (!reason) return;
    setBusy(true);
    try {
      await fetch(`/api/settlement/cycles/${cycle.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dualControl: true, reason }),
      });
      window.location.reload();
    } catch { /* ignore */ }
    setBusy(false);
  }

  const totalScore = cycle.lines.reduce((s, l) => s + l.scoreTotal, 0);
  const totalPob = cycle.lines.reduce((s, l) => s + l.pobCount, 0);

  return (
    <div>
      <Link href="/dashboard/settlement" style={{ fontSize: 13, color: "var(--accent)" }}>
        &larr; All Cycles
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
            {cycle.kind} Cycle
          </h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={`badge ${STATUS_COLORS[cycle.status] ?? ""}`} style={{ fontSize: 11 }}>{cycle.status.replace(/_/g, " ")}</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {new Date(cycle.startAt).toLocaleDateString()} - {new Date(cycle.endAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 6 }}>
            {cycle.status === "RECONCILED" && (
              <button className="button" style={{ fontSize: 11, padding: "4px 12px" }} disabled={busy} onClick={requestLock}>
                Request Lock (Dual)
              </button>
            )}
            {(cycle.status === "LOCKED" || cycle.status === "EXPORTED") && (
              <button className="button" style={{ fontSize: 11, padding: "4px 12px", background: "var(--yellow)", color: "#000" }} disabled={busy} onClick={requestReopen}>
                Request Reopen (Dual)
              </button>
            )}
          </div>
        )}
      </div>

      {pendingApprovals.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, border: "1px solid var(--yellow)" }}>
          <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 8px" }}>Pending Approvals</p>
          {pendingApprovals.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
              <span><span className="badge badge-yellow" style={{ fontSize: 10 }}>{a.actionType}</span> — {a.reason || "No reason"}</span>
              <span className="muted">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Pool</p>
          <span style={{ fontSize: 20, fontWeight: 700 }}>${cycle.pool.toLocaleString()}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Nodes</p>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{cycle.lines.length}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Total PoB</p>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{totalPob}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Total Score</p>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{totalScore.toFixed(1)}</span>
        </div>
      </div>

      {cycle.reopenReason && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 4px" }}>Reopen Reason</p>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{cycle.reopenReason}</p>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Allocation Lines ({cycle.lines.length})</h2>
        {cycle.lines.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No lines generated yet.</p>
        ) : (
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "6px 0" }}>Node</th>
                <th>Score</th>
                <th>PoB Count</th>
                <th>Allocation</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {cycle.lines.map((l) => (
                <tr key={l.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "6px 0" }}>
                    <Link href={`/dashboard/nodes/${l.node.id}`}>{l.node.name}</Link>
                  </td>
                  <td>{l.scoreTotal.toFixed(1)}</td>
                  <td>{l.pobCount}</td>
                  <td>${l.allocation.toLocaleString()}</td>
                  <td className="muted">{totalScore > 0 ? `${((l.scoreTotal / totalScore) * 100).toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
