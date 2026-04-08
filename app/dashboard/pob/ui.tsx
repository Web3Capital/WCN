"use client";

import { useMemo, useState } from "react";

type TinyRow = { id: string; name?: string; title?: string };
type PobRow = {
  id: string;
  businessType: string;
  baseValue: number;
  weight: number;
  qualityMult: number;
  timeMult: number;
  riskDiscount: number;
  score: number;
  status: string;
  notes: string | null;
  taskId: string | null;
  projectId: string | null;
  nodeId: string | null;
};

const POB_STATUS = ["PENDING", "REVIEWING", "APPROVED", "REJECTED"] as const;

export function PobConsole({
  initial,
  tasks,
  projects,
  nodes
}: {
  initial: PobRow[];
  tasks: TinyRow[];
  projects: TinyRow[];
  nodes: TinyRow[];
}) {
  const [rows, setRows] = useState<PobRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [create, setCreate] = useState({
    businessType: "fundraising",
    baseValue: 0,
    weight: 1,
    qualityMult: 1,
    timeMult: 1,
    riskDiscount: 1,
    status: "PENDING",
    taskId: "",
    projectId: "",
    nodeId: ""
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/pob", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? "Failed to load PoB.");
    setRows(data.pob);
    if (!selectedId && data.pob?.[0]?.id) setSelectedId(data.pob[0].id);
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/pob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...create,
          taskId: create.taskId || null,
          projectId: create.projectId || null,
          nodeId: create.nodeId || null
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

  async function onSave(patch: any) {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/pob/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Save failed.");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="apps-layout">
      <div>
        <div className="pill" style={{ marginBottom: 10 }}>
          Create PoB record
        </div>
        <div className="form" style={{ marginBottom: 14 }}>
          <label className="field">
            <span className="label">Business type</span>
            <input
              value={create.businessType}
              onChange={(e) => setCreate((s) => ({ ...s, businessType: e.target.value }))}
            />
          </label>
          <div className="grid-3" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Base value</span>
              <input
                type="number"
                value={create.baseValue}
                onChange={(e) => setCreate((s) => ({ ...s, baseValue: Number(e.target.value) }))}
              />
            </label>
            <label className="field">
              <span className="label">Weight</span>
              <input
                type="number"
                value={create.weight}
                onChange={(e) => setCreate((s) => ({ ...s, weight: Number(e.target.value) }))}
              />
            </label>
            <label className="field">
              <span className="label">Status</span>
              <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                {POB_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid-3" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Quality</span>
              <input
                type="number"
                value={create.qualityMult}
                onChange={(e) => setCreate((s) => ({ ...s, qualityMult: Number(e.target.value) }))}
              />
            </label>
            <label className="field">
              <span className="label">Time</span>
              <input
                type="number"
                value={create.timeMult}
                onChange={(e) => setCreate((s) => ({ ...s, timeMult: Number(e.target.value) }))}
              />
            </label>
            <label className="field">
              <span className="label">Risk discount</span>
              <input
                type="number"
                value={create.riskDiscount}
                onChange={(e) => setCreate((s) => ({ ...s, riskDiscount: Number(e.target.value) }))}
              />
            </label>
          </div>
          <label className="field">
            <span className="label">Task</span>
            <select value={create.taskId} onChange={(e) => setCreate((s) => ({ ...s, taskId: e.target.value }))}>
              <option value="">—</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title ?? t.id}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Project</span>
            <select value={create.projectId} onChange={(e) => setCreate((s) => ({ ...s, projectId: e.target.value }))}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Node</span>
            <select value={create.nodeId} onChange={(e) => setCreate((s) => ({ ...s, nodeId: e.target.value }))}>
              <option value="">—</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name ?? n.id}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="button" disabled={busy || !create.businessType.trim()} onClick={onCreate}>
            {busy ? "Working..." : "Create"}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="pill" style={{ marginBottom: 10 }}>
          Records ({rows.length})
        </div>
        <div className="apps-list">
          {rows.map((r) => {
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                className="apps-row"
                style={{
                  borderColor: active ? "color-mix(in oklab, var(--accent) 55%, var(--line))" : undefined
                }}
                onClick={() => setSelectedId(r.id)}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{r.businessType}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {r.status} · score {Math.round((r.score ?? 0) * 100) / 100}
                  </div>
                </div>
                <div className="pill">{r.nodeId ? "Node" : "—"}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="pill" style={{ marginBottom: 10 }}>
          Review / update
        </div>
        {selected ? (
          <div className="form">
            <div className="grid-2" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Status</span>
                <select defaultValue={selected.status} onChange={(e) => onSave({ status: e.target.value })}>
                  {POB_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Score</span>
                <input value={String(selected.score ?? 0)} readOnly />
              </label>
            </div>
            <label className="field">
              <span className="label">Notes</span>
              <textarea defaultValue={selected.notes ?? ""} onBlur={(e) => onSave({ notes: e.target.value })} />
            </label>
            <button className="button-secondary" type="button" disabled={busy} onClick={() => refresh()}>
              {busy ? "Working..." : "Refresh"}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <p className="muted">Select a record.</p>
        )}
      </div>
    </div>
  );
}

