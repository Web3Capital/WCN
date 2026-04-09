"use client";

import { useMemo, useState } from "react";
import { getApiErrorMessageFromJson } from "@/lib/api-error";
import { ConfirmDialog } from "../_components/confirm-dialog";

type CycleRow = {
  id: string;
  kind: string;
  status: string;
  startAt: string;
  endAt: string;
  pool: number;
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "", RECONCILED: "badge-amber", LOCKED: "badge-purple",
  EXPORTED: "badge-green", REOPENED: "badge-yellow",
  LOCK_PENDING_APPROVAL: "badge-amber", REOPEN_PENDING_APPROVAL: "badge-amber",
};

export function SettlementConsole({ initial, readOnly = false }: { initial: CycleRow[]; readOnly?: boolean }) {
  const [rows, setRows] = useState<CycleRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [create, setCreate] = useState({ kind: "MONTH", startAt: "", endAt: "", pool: 100000 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<any[] | null>(null);
  const [reopenOpen, setReopenOpen] = useState(false);

  async function refresh() {
    const res = await fetch("/api/settlement/cycles", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
    setRows(data.cycles);
    if (!selectedId && data.cycles?.[0]?.id) setSelectedId(data.cycles[0].id);
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
    } catch (e: any) {
      setError(e?.message ?? "Create failed.");
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
      setError(e?.message ?? "Lock failed.");
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
      setLines(data.lines ?? null);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Generate failed.");
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
      if (!data?.ok) throw new Error(data?.error ?? "Reopen failed.");
      await refresh();
    } catch (e: any) { setError(e?.message ?? "Reopen failed."); } finally { setBusy(false); }
  }

  return (
    <div className="apps-layout">
      <div>
        {!readOnly ? (
          <>
            <div className="pill" style={{ marginBottom: 10 }}>Create cycle</div>
            <div className="form" style={{ marginBottom: 14 }}>
              <div className="grid-3" style={{ gap: 12 }}>
                <label className="field">
                  <span className="label">Kind</span>
                  <select value={create.kind} onChange={(e) => setCreate((s) => ({ ...s, kind: e.target.value }))}>
                    <option value="WEEK">WEEK</option>
                    <option value="MONTH">MONTH</option>
                  </select>
                </label>
                <label className="field">
                  <span className="label">Pool</span>
                  <input type="number" value={create.pool} onChange={(e) => setCreate((s) => ({ ...s, pool: Number(e.target.value) }))} />
                </label>
                <label className="field">
                  <span className="label">Start (ISO)</span>
                  <input value={create.startAt} onChange={(e) => setCreate((s) => ({ ...s, startAt: e.target.value }))} />
                </label>
              </div>
              <label className="field">
                <span className="label">End (ISO)</span>
                <input value={create.endAt} onChange={(e) => setCreate((s) => ({ ...s, endAt: e.target.value }))} />
              </label>
              <button className="button" type="button" disabled={busy || !create.startAt || !create.endAt} onClick={onCreate}>
                {busy ? "Working..." : "Create"}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </>
        ) : null}

        <div className="pill" style={{ marginBottom: 10 }}>Cycles ({rows.length})</div>
        <div className="apps-list">
          {rows.length === 0 && (
            <div className="empty-state"><p>No cycles yet.</p></div>
          )}
          {rows.map((c) => (
            <button key={c.id} type="button" className="apps-row" data-active={c.id === selectedId ? "true" : "false"} onClick={() => setSelectedId(c.id)}>
              <div>
                <div style={{ fontWeight: 800 }}>{c.kind}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  <span className={`badge ${STATUS_BADGE[c.status] ?? ""}`} style={{ fontSize: 10, marginRight: 6 }}>{c.status}</span>
                  pool {c.pool.toLocaleString()}
                </div>
              </div>
              <div className="pill">{new Date(c.startAt).toISOString().slice(0, 10)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="apps-detail">
        <div className="pill" style={{ marginBottom: 10 }}>Cycle actions</div>
        {selected ? (
          <div className="form">
            <div className="detail-header">
              <div>
                <h3 style={{ margin: 0 }}>{selected.kind} Cycle</h3>
                <div className="detail-header-meta">
                  <span className={`badge ${STATUS_BADGE[selected.status] ?? ""}`}>{selected.status}</span>
                  <span className="muted" style={{ fontSize: 12 }}>Pool: {selected.pool.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {new Date(selected.startAt).toLocaleDateString()} → {new Date(selected.endAt).toLocaleDateString()}
            </p>

            {!readOnly ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="button-secondary" type="button" disabled={busy} onClick={lockCycle}>Lock</button>
                <button className="button" type="button" disabled={busy} onClick={generateLines}>Generate lines</button>
                <button className="button-secondary" type="button" disabled={!lines?.length} onClick={exportCsv}>Export CSV</button>
                <button className="button-secondary" type="button" disabled={busy} onClick={async () => {
                  if (!selected) return;
                  setBusy(true);
                  try {
                    const res = await fetch(`/api/settlement/cycles/${selected.id}/export`, { method: "POST" });
                    const data = await res.json();
                    if (!data?.ok) throw new Error(data?.error ?? "Export failed.");
                    await refresh();
                  } catch (e: any) { setError(e?.message ?? "Export failed."); } finally { setBusy(false); }
                }}>
                  Export &amp; Lock
                </button>
                <button className="button-secondary" type="button" disabled={busy} style={{ color: "var(--amber)" }} onClick={() => setReopenOpen(true)}>
                  Reopen
                </button>
              </div>
            ) : null}

            {lines?.length ? (
              <div className="card" style={{ marginTop: 12, padding: 18 }}>
                <h3 style={{ margin: "0 0 12px" }}>Allocation Lines</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Node</th>
                      <th>Score</th>
                      <th>PoB Count</th>
                      <th>Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.slice(0, 30).map((l: any) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 700 }}>{l.node?.name ?? l.nodeId}</td>
                        <td>{Math.round(l.scoreTotal * 100) / 100}</td>
                        <td>{l.pobCount}</td>
                        <td style={{ fontWeight: 700 }}>{Math.round(l.allocation * 100) / 100}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>Showing first 30 lines.</p>
              </div>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <div className="empty-state"><p>Select a cycle.</p></div>
        )}
      </div>

      <ConfirmDialog
        open={reopenOpen}
        title="Reopen Settlement Cycle"
        description="This action requires dual-control approval. Provide a reason."
        confirmLabel="Submit Reopen"
        variant="danger"
        withInput
        inputLabel="Reason"
        inputPlaceholder="Reason for reopening..."
        onConfirm={handleReopen}
        onCancel={() => setReopenOpen(false)}
      />
    </div>
  );
}
