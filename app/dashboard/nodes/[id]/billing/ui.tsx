"use client";

import Link from "next/link";

type Seat = { id: string; level: number; status: string; createdAt: string };
type StakeEntry = { id: string; action: string; amount: number; notes: string | null; createdAt: string };
type NodeData = {
  id: string;
  name: string;
  billingStatus: string | null;
  depositStatus: string | null;
  seatFeeStatus: string | null;
  seats: Seat[];
  stakeLedger: StakeEntry[];
};

export function NodeBillingUI({ node, isAdmin }: { node: NodeData; isAdmin: boolean }) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/dashboard/nodes/${node.id}`} style={{ fontSize: 13, color: "var(--accent)" }}>
          &larr; Back to {node.name}
        </Link>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Billing & Contract: {node.name}</h1>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Billing Status</div>
          <span className="badge" style={{ fontSize: 12, marginTop: 6 }}>{node.billingStatus ?? "N/A"}</span>
        </div>
        <div className="stat-card">
          <div className="stat-label">Deposit Status</div>
          <span className="badge" style={{ fontSize: 12, marginTop: 6 }}>{node.depositStatus ?? "N/A"}</span>
        </div>
        <div className="stat-card">
          <div className="stat-label">Seat Fee Status</div>
          <span className="badge" style={{ fontSize: 12, marginTop: 6 }}>{node.seatFeeStatus ?? "N/A"}</span>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Seats</div>
          <div className="stat-number" style={{ marginTop: 4 }}>{node.seats.filter(s => s.status === "ACTIVE").length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Seats ({node.seats.length})</h2>
        {node.seats.length === 0 ? (
          <div className="empty-state"><p>No seats.</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Level</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {node.seats.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.level}</td>
                  <td><span className={`badge ${s.status === "ACTIVE" ? "badge-green" : ""}`}>{s.status}</span></td>
                  <td className="muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Stake Ledger ({node.stakeLedger.length})</h2>
        {node.stakeLedger.length === 0 ? (
          <div className="empty-state"><p>No stake entries.</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Action</th><th>Amount</th><th>Notes</th><th>Date</th></tr>
            </thead>
            <tbody>
              {node.stakeLedger.map((e) => (
                <tr key={e.id}>
                  <td><span className="badge" style={{ fontSize: 10 }}>{e.action}</span></td>
                  <td style={{ fontWeight: 600 }}>{e.amount.toLocaleString()}</td>
                  <td className="muted">{e.notes ?? "—"}</td>
                  <td className="muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
