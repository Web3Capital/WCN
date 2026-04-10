"use client";

import { useState } from "react";
import { EmptyState } from "../_components";

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

export function AuditConsole({ initial, actions }: { initial: AuditRow[]; actions: string[] }) {
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

  return (
    <div>
      <div className="grid-3 gap-12 mb-14">
        <label className="field">
          <span className="label">Action</span>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
            <option value="">All</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Target type</span>
          <input
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            placeholder="e.g. POB, USER, NODE"
          />
        </label>
        <label className="field">
          <span className="label">Since</span>
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </label>
      </div>
      <div className="cta-row mb-14">
        <button className="button" type="button" disabled={loading} onClick={() => search()}>
          {loading ? "Loading..." : "Search"}
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
                  {r.targetType}:{r.targetId.slice(0, 8)} · {r.actor?.name || r.actor?.email || "system"}
                </div>
                <div className="muted text-xs">{fmtDate(r.createdAt)}</div>
              </div>
            </button>
          ))}
          {rows.length === 0 && <EmptyState message="No audit events found." />}
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
                  <strong>Actor</strong>
                  <span className="muted">{selected.actor?.name || selected.actor?.email || "system"}</span>
                </div>
                <div className="kpi">
                  <strong>Target ID</strong>
                  <span className="muted text-sm" style={{ wordBreak: "break-all" }}>{selected.targetId}</span>
                </div>
              </div>
              {selected.metadata ? (
                <div className="mt-14">
                  <div className="label">Metadata</div>
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
            <EmptyState message="Select an event to view details." />
          )}
        </div>
      </div>

      {cursor ? (
        <div className="mt-14 text-center">
          <button className="button-secondary" type="button" disabled={loading} onClick={() => search(true)}>
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
