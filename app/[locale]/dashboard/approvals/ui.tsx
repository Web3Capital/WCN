"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge, FilterToolbar, EmptyState, LoadingState, StatCard, DashboardDistributionPie, DashboardPipelineBar } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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
  const { t } = useAutoTranslate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const refreshCounts = useCallback(() => {
    fetch("/api/approvals?aggregate=1")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.data && typeof d.data === "object") setStatusCounts(d.data as Record<string, number>);
      })
      .catch((err) => console.error("[Approvals] aggregate failed", err));
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    // Intentional sync-on-prop pattern (close on navigate / reset on open).
    // React docs flag this as cascade risk; see issue 0002 for refactor plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/approvals?status=${filter}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setApprovals(d.data ?? []); })
      .catch((err) => console.error("[Approvals] fetch failed", err))
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
        refreshCounts();
      }
    } catch { /* ignore */ }
    setBusy(null);
  }

  const totalTracked = (statusCounts.PENDING ?? 0) + (statusCounts.APPROVED ?? 0) + (statusCounts.REJECTED ?? 0);
  const approvalStatusColors: Record<string, string> = {
    PENDING: "#f59e0b",
    APPROVED: "#22c55e",
    REJECTED: "#ef4444",
  };
  const approvalOrder = ["PENDING", "APPROVED", "REJECTED"] as const;
  const approvalPalette = ["#f59e0b", "#22c55e", "#ef4444"] as const;

  return (
    <div className="flex flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("Pending")} value={statusCounts.PENDING ?? 0} />
        <StatCard label={t("Approved")} value={statusCounts.APPROVED ?? 0} />
        <StatCard label={t("Rejected")} value={statusCounts.REJECTED ?? 0} />
        <StatCard label={t("Total")} value={totalTracked} />
      </div>
      {Object.keys(statusCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status distribution")}</h3>
            <DashboardDistributionPie data={statusCounts} colorMap={approvalStatusColors} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={approvalOrder} data={statusCounts} palette={approvalPalette} />
          </div>
        </div>
      )}
      <FilterToolbar
        filters={FILTERS}
        active={filter}
        onChange={setFilter}
        counts={statusCounts as Partial<Record<(typeof FILTERS)[number], number>>}
      />

      {loading ? (
        <LoadingState />
      ) : approvals.length === 0 ? (
        <EmptyState message={t(`No ${filter.toLowerCase()} approvals.`)} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Status")}</th>
              <th>{t("Action")}</th>
              <th>{t("Entity")}</th>
              <th>{t("Reason")}</th>
              <th>{t("Requested")}</th>
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
                  {a.decidedAt && <div>{t("Decided:")} {new Date(a.decidedAt).toLocaleString()}</div>}
                </td>
                <td>
                  {a.status === "PENDING" && (
                    <div className="flex gap-4">
                      <button className="button" style={{ fontSize: 11, padding: "4px 12px" }} disabled={busy === a.id} onClick={() => decide(a.id, "APPROVED")}>
                        {t("Approve")}
                      </button>
                      <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px", color: "var(--red)" }} disabled={busy === a.id} onClick={() => decide(a.id, "REJECTED")}>
                        {t("Reject")}
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
