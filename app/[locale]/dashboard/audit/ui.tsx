"use client";

import { useMemo, useState } from "react";
import { EmptyState, StatCard, DashboardDistributionPie } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: any;
  createdAt: string | Date;
  actor: { id: string; name: string | null; email: string | null } | null;
};

function fmtDate(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function AuditConsole({
  initial,
  actions,
  actionCounts = {},
}: {
  initial: AuditRow[];
  actions: string[];
  actionCounts?: Record<string, number>;
}) {
  const { t } = useAutoTranslate();
  const [rows, setRows] = useState<AuditRow[]>(initial);
  const [filterAction, setFilterAction] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [since, setSince] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function search(append = false) {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterAction) params.set("action", filterAction);
    if (filterTarget) params.set("targetType", filterTarget);
    if (since) params.set("since", since);
    if (append && cursor) params.set("cursor", cursor);
    params.set("limit", "50");

    const res = await fetch(`/api/audit?${params}`, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!data?.ok) return;
    const payload = data.data;
    if (!payload) return;
    if (append) {
      setRows((prev) => [...prev, ...payload.logs]);
    } else {
      setRows(payload.logs);
    }
    setCursor(payload.nextCursor ?? null);
  }

  const selected = selectedId ? rows.find((r) => r.id === selectedId) ?? null : null;

  const auditTotals = useMemo(() => {
    const catalogTotal = Object.values(actionCounts).reduce((a, b) => a + b, 0);
    const distinctActions = Object.keys(actionCounts).length;
    return { catalogTotal, distinctActions, loaded: rows.length };
  }, [actionCounts, rows.length]);

  const actionColorMap = useMemo(() => {
    const palette = ["#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9", "#a855f7", "#94a3b8"] as const;
    const m: Record<string, string> = {};
    actions.forEach((a, i) => {
      m[a] = palette[i % palette.length];
    });
    return m;
  }, [actions]);

  return (
    <div className="flex flex-col gap-16">
      <div className="grid-3 gap-12">
        <StatCard label={t("Events (catalog)")} value={auditTotals.catalogTotal} />
        <StatCard label={t("Action types")} value={auditTotals.distinctActions} />
        <StatCard label={t("Rows loaded")} value={auditTotals.loaded} />
      </div>
      {Object.keys(actionCounts).length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Events by action")}</h3>
          <DashboardDistributionPie data={actionCounts} colorMap={actionColorMap} />
        </div>
      )}
      <div className="grid-3 gap-12 mb-14">
        <label className="field">
          <span className="label">{t("Action")}</span>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
            <option value="">{t("All")}</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">{t("Target type")}</span>
          <input
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            placeholder={t("e.g. POB, USER, NODE")}
          />
        </label>
        <label className="field">
          <span className="label">{t("Since")}</span>
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </label>
      </div>
      <div className="cta-row mb-14">
        <button className="button" type="button" disabled={loading} onClick={() => search()}>
          {loading ? t("Loading...") : t("Search")}
        </button>
      </div>

      <div className="apps-layout">
        <div className="apps-list">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              className="apps-row"
              data-active={r.id === selectedId ? "true" : "false"}
              onClick={() => setSelectedId(r.id)}
            >
              <div style={{ display: "grid", gap: 2 }}>
                <div className="font-bold" style={{ color: "var(--text)" }}>{r.action}</div>
                <div className="muted text-sm">
                  {r.targetType}:{r.targetId.slice(0, 8)} · {r.actor?.name || r.actor?.email || t("system")}
                </div>
                <div className="muted text-xs">{fmtDate(r.createdAt)}</div>
              </div>
            </button>
          ))}
          {rows.length === 0 && <EmptyState message={t("No audit events found.")} />}
        </div>

        <div className="apps-detail">
          {selected ? (
            <>
              <div className="apps-detail-head">
                <div>
                  <h3 className="mb-6">{selected.action}</h3>
                  <p className="muted" style={{ margin: 0 }}>{fmtDate(selected.createdAt)}</p>
                </div>
                <span className="pill">{selected.targetType}</span>
              </div>
              <div className="grid-2 mt-14 gap-12">
                <div className="kpi">
                  <strong>{t("Actor")}</strong>
                  <span className="muted">{selected.actor?.name || selected.actor?.email || t("system")}</span>
                </div>
                <div className="kpi">
                  <strong>{t("Target ID")}</strong>
                  <span className="muted text-sm" style={{ wordBreak: "break-all" }}>{selected.targetId}</span>
                </div>
              </div>
              {selected.metadata ? (
                <div className="mt-14">
                  <div className="label">{t("Metadata")}</div>
                  <pre
                    className="muted text-xs"
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      background: "var(--surface)",
                      padding: 12,
                      borderRadius: 8
                    }}
                  >
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState message={t("Select an event to view details.")} />
          )}
        </div>
      </div>

      {cursor ? (
        <div className="mt-14 text-center">
          <button className="button-secondary" type="button" disabled={loading} onClick={() => search(true)}>
            {loading ? t("Loading...") : t("Load more")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
