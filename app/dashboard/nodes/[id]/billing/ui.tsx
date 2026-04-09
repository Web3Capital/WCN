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
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Billing Status</p>
          <span className="badge" style={{ fontSize: 12 }}>{node.billingStatus ?? "N/A"}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Deposit Status</p>
          <span className="badge" style={{ fontSize: 12 }}>{node.depositStatus ?? "N/A"}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Seat Fee Status</p>
          <span className="badge" style={{ fontSize: 12 }}>{node.seatFeeStatus ?? "N/A"}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Active Seats</p>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{node.seats.filter(s => s.status === "ACTIVE").length}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Seats ({node.seats.length})</h2>
        {node.seats.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No seats.</p>
        ) : (
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "6px 0" }}>Level</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {node.seats.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "6px 0" }}>{s.level}</td>
                  <td><span className={`badge ${s.status === "ACTIVE" ? "badge-green" : ""}`} style={{ fontSize: 10 }}>{s.status}</span></td>
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
          <p className="muted" style={{ fontSize: 13 }}>No stake entries.</p>
        ) : (
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "6px 0" }}>Action</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {node.stakeLedger.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "6px 0" }}><span className="badge" style={{ fontSize: 10 }}>{e.action}</span></td>
                  <td>{e.amount.toLocaleString()}</td>
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
