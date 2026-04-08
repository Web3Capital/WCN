"use client";

import { useMemo, useState } from "react";

type CycleRow = {
  id: string;
  kind: string;
  status: string;
  startAt: string;
  endAt: string;
  pool: number;
};

export function SettlementConsole({ initial, readOnly = false }: { initial: CycleRow[]; readOnly?: boolean }) {
  const [rows, setRows] = useState<CycleRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [create, setCreate] = useState({
    kind: "MONTH",
    startAt: "",
    endAt: "",
    pool: 100000
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<any[] | null>(null);

  async function refresh() {
    const res = await fetch("/api/settlement/cycles", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? "Failed to load cycles.");
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
        body: JSON.stringify({
          kind: create.kind,
          startAt: create.startAt,
          endAt: create.endAt,
          pool: create.pool
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Create failed.");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function lockCycle() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/settlement/cycles/${selected.id}/lock`, { method: "POST" });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Lock failed.");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Lock failed.");
    } finally {
      setBusy(false);
    }
  }

  async function generateLines() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/settlement/cycles/${selected.id}/generate`, { method: "POST" });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Generate failed.");
      setLines(data.lines ?? null);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Generate failed.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    if (!lines?.length) return;
    const header = ["nodeId", "nodeName", "scoreTotal", "allocation", "pobCount"].join(",");
    const rows = lines.map((l: any) =>
      [l.nodeId, JSON.stringify(l.node?.name ?? ""), l.scoreTotal, l.allocation, l.pobCount].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settlement.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="apps-layout">
      <div>
        {!readOnly ? (
          <>
            <div className="pill" style={{ marginBottom: 10 }}>
              Create cycle
            </div>
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
                  <input
                    type="number"
                    value={create.pool}
                    onChange={(e) => setCreate((s) => ({ ...s, pool: Number(e.target.value) }))}
                  />
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

        <div className="pill" style={{ marginBottom: 10 }}>
          Cycles ({rows.length})
        </div>
        <div className="apps-list">
          {rows.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                className="apps-row"
                style={{ borderColor: active ? "color-mix(in oklab, var(--accent) 55%, var(--line))" : undefined }}
                onClick={() => setSelectedId(c.id)}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{c.kind}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {c.status} · pool {c.pool}
                  </div>
                </div>
                <div className="pill">{new Date(c.startAt).toISOString().slice(0, 10)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="pill" style={{ marginBottom: 10 }}>
          Cycle actions
        </div>
        {selected ? (
          <div className="form">
            <p className="muted" style={{ margin: 0 }}>
              {selected.kind} · {selected.status}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              {selected.startAt} → {selected.endAt}
            </p>
            {!readOnly ? (
              <>
                <button className="button-secondary" type="button" disabled={busy} onClick={lockCycle}>
                  Lock
                </button>
                <button className="button" type="button" disabled={busy} onClick={generateLines}>
                  Generate lines
                </button>
                <button className="button-secondary" type="button" disabled={!lines?.length} onClick={exportCsv}>
                  Export CSV
                </button>
              </>
            ) : null}
            {lines?.length ? (
              <div className="card" style={{ marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Lines</h3>
                <div className="apps-list">
                  {lines.slice(0, 30).map((l: any) => (
                    <div key={l.id} className="apps-row" style={{ cursor: "default" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{l.node?.name ?? l.nodeId}</div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          score {Math.round(l.scoreTotal * 100) / 100} · pob {l.pobCount}
                        </div>
                      </div>
                      <div className="pill">{Math.round(l.allocation * 100) / 100}</div>
                    </div>
                  ))}
                </div>
                <p className="muted" style={{ marginTop: 10 }}>
                  Showing first 30 lines.
                </p>
              </div>
            ) : null}
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <p className="muted">Select a cycle.</p>
        )}
      </div>
    </div>
  );
}

