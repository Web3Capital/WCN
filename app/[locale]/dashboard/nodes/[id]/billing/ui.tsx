"use client";

import { DetailLayout, StatCard, EmptyState } from "../../../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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
  const { t } = useAutoTranslate();
  return (
    <DetailLayout
      backHref={`/dashboard/nodes/${node.id}`}
      backLabel={t(`Back to ${node.name}`)}
      title={t(`Billing & Contract: ${node.name}`)}
    >
      <div className="grid-4">
        <StatCard label={t("Billing Status")} value={node.billingStatus ?? t("N/A")} />
        <StatCard label={t("Deposit Status")} value={node.depositStatus ?? t("N/A")} />
        <StatCard label={t("Seat Fee Status")} value={node.seatFeeStatus ?? t("N/A")} />
        <StatCard label={t("Active Seats")} value={node.seats.filter(s => s.status === "ACTIVE").length} />
      </div>

      <div className="card p-20">
        <h2 className="text-lg font-semibold mb-12 mt-0">{t("Seats")} ({node.seats.length})</h2>
        {node.seats.length === 0 ? (
          <EmptyState message={t("No seats.")} />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>{t("Level")}</th><th>{t("Status")}</th><th>{t("Created")}</th></tr>
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
        <h2 className="text-lg font-semibold mb-12 mt-0">{t("Stake Ledger")} ({node.stakeLedger.length})</h2>
        {node.stakeLedger.length === 0 ? (
          <EmptyState message={t("No stake entries.")} />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>{t("Action")}</th><th>{t("Amount")}</th><th>{t("Notes")}</th><th>{t("Date")}</th></tr>
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
