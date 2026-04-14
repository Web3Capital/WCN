"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { StatusBadge, EmptyState, ConfirmDialog, StatCard, DashboardDistributionPie, DashboardPipelineBar } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type Dispute = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolution: string | null;
  windowEndsAt: string | null;
  createdAt: string;
  resolvedAt: string | null;
  pob: { id: string; businessType: string; loopType: string | null } | null;
};

const FILTERS = ["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED", "ESCALATED"] as const;

export function DisputesUI({ disputes: initialDisputes }: { disputes: Dispute[] }) {
  const { t } = useAutoTranslate();
  const [disputes, setDisputes] = useState(initialDisputes);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ id: string; status: string; defaultResolution: string } | null>(null);

  const filtered = filter === "ALL" ? disputes : disputes.filter((d) => d.status === filter);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of disputes) c[d.status] = (c[d.status] ?? 0) + 1;
    return c;
  }, [disputes]);

  const disputeKpis = useMemo(() => {
    const total = disputes.length;
    const open = disputes.filter((d) => d.status === "OPEN").length;
    const underReview = disputes.filter((d) => d.status === "UNDER_REVIEW").length;
    const closed = disputes.filter((d) => d.status === "RESOLVED" || d.status === "DISMISSED").length;
    return { total, open, underReview, closed };
  }, [disputes]);

  const disputeStatusColors: Record<string, string> = {
    OPEN: "#f59e0b",
    UNDER_REVIEW: "#6366f1",
    RESOLVED: "#22c55e",
    DISMISSED: "#94a3b8",
    ESCALATED: "#ef4444",
  };
  const disputePipelineOrder = ["OPEN", "UNDER_REVIEW", "ESCALATED", "RESOLVED", "DISMISSED"] as const;
  const disputePipelinePalette = ["#f59e0b", "#6366f1", "#ef4444", "#22c55e", "#94a3b8"] as const;

  async function resolve(id: string, resolution: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      const data = await res.json();
      if (data.ok) {
        setDisputes((prev) => prev.map((d) =>
          d.id === id ? { ...d, status, resolution, resolvedAt: new Date().toISOString() } : d
        ));
      }
    } catch { /* ignore */ }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("Disputes")} value={disputeKpis.total} />
        <StatCard label={t("Open")} value={disputeKpis.open} />
        <StatCard label={t("Under review")} value={disputeKpis.underReview} />
        <StatCard label={t("Closed")} value={disputeKpis.closed} />
      </div>
      {Object.keys(statusCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status distribution")}</h3>
            <DashboardDistributionPie data={statusCounts} colorMap={disputeStatusColors} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={disputePipelineOrder} data={statusCounts} palette={disputePipelinePalette} />
          </div>
        </div>
      )}
      <div className="page-toolbar mb-20">
        <p className="muted text-sm" style={{ margin: 0 }}>{disputes.length} {t("total disputes")}</p>
        <div className="page-toolbar-spacer" />
        <div className="chip-group">
          {FILTERS.map((s) => (
            <button key={s} className={`chip ${filter === s ? "chip-active" : ""}`} onClick={() => setFilter(s)}>
              {t(s.replace(/_/g, " "))}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={t("No disputes matching filter.")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Status")}</th>
              <th>{t("Target")}</th>
              <th>{t("Reason")}</th>
              <th>{t("Filed")}</th>
              <th>{t("Window")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <StatusBadge status={d.status} />
                  {d.pob && <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{t("PoB:")} {d.pob.businessType}</div>}
                </td>
                <td>
                  <span className="badge text-xs">{d.targetType}</span>
                </td>
                <td>
                  <Link href={`/dashboard/disputes/${d.id}`} className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{d.reason}</Link>
                  {d.resolution && <div className="muted text-xs" style={{ marginTop: 2 }}>{d.resolution}</div>}
                </td>
                <td className="muted text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="muted text-xs">
                  {d.windowEndsAt ? new Date(d.windowEndsAt).toLocaleDateString() : "—"}
                </td>
                <td>
                  {d.status === "OPEN" && (
                    <div className="flex gap-4">
                      <button className="button" style={{ fontSize: 10, padding: "3px 8px" }} disabled={busy === d.id}
                        onClick={() => setDialog({ id: d.id, status: "RESOLVED", defaultResolution: t("Resolved by reviewer.") })}>
                        {t("Resolve")}
                      </button>
                      <button className="button-secondary" style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }} disabled={busy === d.id}
                        onClick={() => resolve(d.id, "Dismissed.", "DISMISSED")}>
                        {t("Dismiss")}
                      </button>
                      <button className="button-secondary" style={{ fontSize: 10, padding: "3px 8px", color: "var(--amber)" }} disabled={busy === d.id}
                        onClick={() => resolve(d.id, "Escalated for further review.", "ESCALATED")}>
                        {t("Escalate")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!dialog}
        title={t("Resolve Dispute")}
        description={t("Provide a resolution note.")}
        confirmLabel={t("Resolve")}
        withInput
        inputLabel={t("Resolution")}
        inputPlaceholder={dialog?.defaultResolution ?? t("Resolution note...")}
        onConfirm={(val) => {
          if (dialog && val) resolve(dialog.id, val, dialog.status);
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
