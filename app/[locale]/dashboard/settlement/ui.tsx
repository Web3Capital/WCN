"use client";

import { useMemo, useState } from "react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { getApiErrorMessageFromJson } from "@/lib/api-error";
import { StatusBadge, FormCard, EmptyState, StatCard, DashboardDistributionPie, DashboardPipelineBar, ReadOnlyInlineStrip } from "../_components";
import { ConfirmDialog } from "../_components/confirm-dialog";

type CycleRow = {
  id: string;
  kind: string;
  status: string;
  startAt: string;
  endAt: string;
  pool: number;
};

export function SettlementConsole({ initial, readOnly = false }: { initial: CycleRow[]; readOnly?: boolean }) {
  const { t } = useAutoTranslate();
  const [rows, setRows] = useState<CycleRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [showForm, setShowForm] = useState(false);
  const [create, setCreate] = useState({ kind: "MONTH", startAt: "", endAt: "", pool: 100000 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<any[] | null>(null);
  const [reopenOpen, setReopenOpen] = useState(false);

  const cycleStatusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);
  const cycleKpis = useMemo(() => {
    const total = rows.length;
    const locked = rows.filter((r) => r.status === "LOCKED" || r.status === "EXPORTED" || r.status === "FINALIZED").length;
    const draft = rows.filter((r) => r.status === "DRAFT").length;
    const poolSum = rows.reduce((s, r) => s + (r.pool ?? 0), 0);
    return { total, locked, draft, poolSum };
  }, [rows]);
  const cycleStatusColors: Record<string, string> = {
    DRAFT: "#94a3b8",
    RECONCILED: "#6366f1",
    LOCK_PENDING_APPROVAL: "#f59e0b",
    LOCKED: "#a855f7",
    EXPORTED: "#22c55e",
    REOPEN_PENDING_APPROVAL: "#f97316",
    REOPENED: "#f59e0b",
    FINALIZED: "#22c55e",
  };
  const cycleOrder = ["DRAFT", "RECONCILED", "LOCK_PENDING_APPROVAL", "LOCKED", "EXPORTED", "FINALIZED"] as const;
  const cyclePalette = ["#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#a855f7", "#94a3b8"] as const;

  async function refresh() {
    const res = await fetch("/api/settlement/cycles", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
    setRows(data.data);
    if (!selectedId && data.data?.[0]?.id) setSelectedId(data.data[0].id);
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/settlement/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: create.kind, startAt: create.startAt, endAt: create.endAt, pool: create.pool })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? t("Create failed."));
    } finally { setBusy(false); }
  }

  async function lockCycle() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/settlement/cycles/${selected.id}/lock`, { method: "POST" });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Lock failed."));
    } finally { setBusy(false); }
  }

  async function generateLines() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/settlement/cycles/${selected.id}/generate`, { method: "POST" });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      setLines(data.data?.lines ?? null);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Generate failed."));
    } finally { setBusy(false); }
  }

  function exportCsv() {
    if (!lines?.length) return;
    const header = ["nodeId", "nodeName", "scoreTotal", "allocation", "pobCount"].join(",");
    const csvRows = lines.map((l: any) =>
      [l.nodeId, JSON.stringify(l.node?.name ?? ""), l.scoreTotal, l.allocation, l.pobCount].join(",")
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settlement.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReopen(reason?: string) {
    if (!selected || !reason) return;
    setReopenOpen(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/settlement/cycles/${selected.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Reopen failed."));
      await refresh();
    } catch (e: any) { setError(e?.message ?? t("Reopen failed.")); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("Cycles")} value={cycleKpis.total} />
        <StatCard label={t("Locked / finalized")} value={cycleKpis.locked} />
        <StatCard label={t("Draft")} value={cycleKpis.draft} />
        <StatCard label={t("Total pool")} value={cycleKpis.poolSum.toLocaleString()} />
      </div>
      {!readOnly && Object.keys(cycleStatusCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status distribution")}</h3>
            <DashboardDistributionPie data={cycleStatusCounts} colorMap={cycleStatusColors} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={cycleOrder} data={cycleStatusCounts} palette={cyclePalette} />
          </div>
        </div>
      )}
      {readOnly ? <ReadOnlyInlineStrip /> : null}
      <div className="apps-layout">
      <div>
        {!readOnly ? (
          <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Create cycle")}>
            <div className="form mb-14">
              <div className="grid-3 gap-12">
                <label className="field">
                  <span className="label">{t("Kind")}</span>
                  <select value={create.kind} onChange={(e) => setCreate((s) => ({ ...s, kind: e.target.value }))}>
                    <option value="WEEK">{t("WEEK")}</option>
                    <option value="MONTH">{t("MONTH")}</option>
                  </select>
                </label>
                <label className="field">
                  <span className="label">{t("Pool")}</span>
                  <input type="number" value={create.pool} onChange={(e) => setCreate((s) => ({ ...s, pool: Number(e.target.value) }))} />
                </label>
                <label className="field">
                  <span className="label">{t("Start (ISO)")}</span>
                  <input value={create.startAt} onChange={(e) => setCreate((s) => ({ ...s, startAt: e.target.value }))} />
                </label>
              </div>
              <label className="field">
                <span className="label">{t("End (ISO)")}</span>
                <input value={create.endAt} onChange={(e) => setCreate((s) => ({ ...s, endAt: e.target.value }))} />
              </label>
              <button className="button" type="button" disabled={busy || !create.startAt || !create.endAt} onClick={onCreate}>
                {busy ? t("Working...") : t("Create")}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </FormCard>
        ) : null}

        <div className="pill mb-10">{t("Cycles")} ({rows.length})</div>
        <div className="apps-list">
          {rows.length === 0 && (
            <EmptyState message={t("No cycles yet.")} />
          )}
          {rows.map((c) => (
            <button key={c.id} type="button" className="apps-row" data-active={c.id === selectedId ? "true" : "false"} onClick={() => setSelectedId(c.id)}>
              <div>
                <div className="font-bold">{c.kind}</div>
                <div className="muted text-sm">
                  <StatusBadge status={c.status} className="text-xs" /> {t("pool")} {c.pool.toLocaleString()}
                </div>
              </div>
              <div className="pill">{new Date(c.startAt).toISOString().slice(0, 10)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="apps-detail">
        <div className="pill mb-10">{t("Cycle actions")}</div>
        {selected ? (
          <div className="form">
            <div className="detail-header">
              <div>
                <h3 style={{ margin: 0 }}>{selected.kind} {t("Cycle")}</h3>
                <div className="detail-header-meta">
                  <StatusBadge status={selected.status} />
                  <span className="muted text-xs">{t("Pool:")} {selected.pool.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <p className="muted mb-0 text-sm">
              {new Date(selected.startAt).toLocaleDateString()} → {new Date(selected.endAt).toLocaleDateString()}
            </p>

            {!readOnly ? (
              <div className="flex flex-wrap gap-6">
                <button className="button-secondary" type="button" disabled={busy} onClick={lockCycle}>{t("Lock")}</button>
                <button className="button" type="button" disabled={busy} onClick={generateLines}>{t("Generate lines")}</button>
                <button className="button-secondary" type="button" disabled={!lines?.length} onClick={exportCsv}>{t("Export CSV")}</button>
                <button className="button-secondary" type="button" disabled={busy} onClick={async () => {
                  if (!selected) return;
                  setBusy(true);
                  try {
                    const res = await fetch(`/api/settlement/cycles/${selected.id}/export`, { method: "POST" });
                    const data = await res.json();
                    if (!data?.ok) throw new Error(data?.error ?? t("Export failed."));
                    await refresh();
                  } catch (e: any) { setError(e?.message ?? t("Export failed.")); } finally { setBusy(false); }
                }}>
                  {t("Export & Lock")}
                </button>
                <button className="button-secondary" type="button" disabled={busy} style={{ color: "var(--amber)" }} onClick={() => setReopenOpen(true)}>
                  {t("Reopen")}
                </button>
              </div>
            ) : null}

            {lines?.length ? (
              <div className="card mt-12 p-18">
                <h3 style={{ margin: "0 0 12px" }}>{t("Allocation Lines")}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Node")}</th>
                      <th>{t("Score")}</th>
                      <th>{t("PoB Count")}</th>
                      <th>{t("Allocation")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.slice(0, 30).map((l: any) => (
                      <tr key={l.id}>
                        <td className="font-bold">{l.node?.name ?? l.nodeId}</td>
                        <td>{Math.round(l.scoreTotal * 100) / 100}</td>
                        <td>{l.pobCount}</td>
                        <td className="font-bold">{Math.round(l.allocation * 100) / 100}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="muted mt-10 text-xs">{t("Showing first 30 lines.")}</p>
              </div>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <EmptyState message={t("Select a cycle.")} />
        )}
      </div>

      <ConfirmDialog
        open={reopenOpen}
        title={t("Reopen Settlement Cycle")}
        description={t("This action requires dual-control approval. Provide a reason.")}
        confirmLabel={t("Submit Reopen")}
        variant="danger"
        withInput
        inputLabel={t("Reason")}
        inputPlaceholder={t("Reason for reopening...")}
        onConfirm={handleReopen}
        onCancel={() => setReopenOpen(false)}
      />
      </div>
    </div>
  );
}
