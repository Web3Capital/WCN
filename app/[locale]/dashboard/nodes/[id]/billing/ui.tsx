"use client";

import { DetailLayout, StatCard, EmptyState } from "../../../_components";

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
    <DetailLayout
      backHref={`/dashboard/nodes/${node.id}`}
      backLabel={`Back to ${node.name}`}
      title={`Billing & Contract: ${node.name}`}
    >
      <div className="grid-4">
        <StatCard label="Billing Status" value={node.billingStatus ?? "N/A"} />
        <StatCard label="Deposit Status" value={node.depositStatus ?? "N/A"} />
        <StatCard label="Seat Fee Status" value={node.seatFeeStatus ?? "N/A"} />
        <StatCard label="Active Seats" value={node.seats.filter(s => s.status === "ACTIVE").length} />
      </div>

      <div className="card p-20">
        <h2 className="text-lg font-semibold mb-12 mt-0">Seats ({node.seats.length})</h2>
        {node.seats.length === 0 ? (
          <EmptyState message="No seats." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Level</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {node.seats.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">{s.level}</td>
                  <td><span className={`badge ${s.status === "ACTIVE" ? "badge-green" : ""}`}>{s.status}</span></td>
                  <td className="muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-20">
        <h2 className="text-lg font-semibold mb-12 mt-0">Stake Ledger ({node.stakeLedger.length})</h2>
        {node.stakeLedger.length === 0 ? (
          <EmptyState message="No stake entries." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Action</th><th>Amount</th><th>Notes</th><th>Date</th></tr>
            </thead>
            <tbody>
              {node.stakeLedger.map((e) => (
                <tr key={e.id}>
                  <td><span className="badge" style={{ fontSize: 10 }}>{e.action}</span></td>
                  <td className="font-semibold">{e.amount.toLocaleString()}</td>
                  <td className="muted">{e.notes ?? "—"}</td>
                  <td className="muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DetailLayout>
  );
}
