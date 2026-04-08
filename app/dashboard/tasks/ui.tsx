"use client";

import { useMemo, useState } from "react";

type NodeRow = { id: string; name: string; type: string };
type ProjectRow = { id: string; name: string };
type TaskRow = {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  projectId: string | null;
  ownerNodeId: string | null;
  dueAt: string | null;
  assignments?: Array<{ nodeId: string }>;
};

const TASK_TYPES = ["FUNDRAISING", "GROWTH", "RESOURCE", "LIQUIDITY", "RESEARCH", "EXECUTION", "OTHER"] as const;
const TASK_STATUS = ["OPEN", "IN_PROGRESS", "WAITING_REVIEW", "DONE", "CANCELLED"] as const;

export function TasksConsole({
  initial,
  projects,
  nodes
}: {
  initial: TaskRow[];
  projects: ProjectRow[];
  nodes: NodeRow[];
}) {
  const [rows, setRows] = useState<TaskRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [create, setCreate] = useState({
    title: "",
    type: "EXECUTION",
    status: "OPEN",
    projectId: "",
    ownerNodeId: "",
    assignNodeIds: [] as string[]
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? "Failed to load tasks.");
    setRows(data.tasks);
    if (!selectedId && data.tasks?.[0]?.id) setSelectedId(data.tasks[0].id);
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: create.title,
          type: create.type,
          status: create.status,
          projectId: create.projectId || null,
          ownerNodeId: create.ownerNodeId || null,
          assignNodeIds: create.assignNodeIds
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Create failed.");
      await refresh();
      setCreate({ title: "", type: "EXECUTION", status: "OPEN", projectId: "", ownerNodeId: "", assignNodeIds: [] });
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
      const res = await fetch(`/api/tasks/${selected.id}`, {
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

  function selectedAssignments() {
    const ids = selected?.assignments?.map((a) => a.nodeId) ?? [];
    return new Set(ids);
  }

  return (
    <div className="apps-layout">
      <div>
        <div className="pill" style={{ marginBottom: 10 }}>
          Create task
        </div>
        <div className="form" style={{ marginBottom: 14 }}>
          <label className="field">
            <span className="label">Title</span>
            <input value={create.title} onChange={(e) => setCreate((s) => ({ ...s, title: e.target.value }))} />
          </label>
          <div className="grid-3" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Type</span>
              <select value={create.type} onChange={(e) => setCreate((s) => ({ ...s, type: e.target.value }))}>
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Status</span>
              <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                {TASK_STATUS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Owner node</span>
              <select value={create.ownerNodeId} onChange={(e) => setCreate((s) => ({ ...s, ownerNodeId: e.target.value }))}>
                <option value="">—</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.type})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span className="label">Project</span>
            <select value={create.projectId} onChange={(e) => setCreate((s) => ({ ...s, projectId: e.target.value }))}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Assign nodes (collaborators)</span>
            <select
              multiple
              value={create.assignNodeIds}
              onChange={(e) =>
                setCreate((s) => ({
                  ...s,
                  assignNodeIds: Array.from(e.target.selectedOptions).map((o) => o.value)
                }))
              }
              style={{ minHeight: 120 }}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.type})
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="button" disabled={busy || !create.title.trim()} onClick={onCreate}>
            {busy ? "Working..." : "Create"}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="pill" style={{ marginBottom: 10 }}>
          Tasks ({rows.length})
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
                  <div style={{ fontWeight: 800 }}>{r.title}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {r.type} · {r.status}
                  </div>
                </div>
                <div className="pill">{r.projectId ? "Project" : "—"}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="pill" style={{ marginBottom: 10 }}>
          Details
        </div>
        {selected ? (
          <div className="form">
            <label className="field">
              <span className="label">Title</span>
              <input defaultValue={selected.title} onBlur={(e) => onSave({ title: e.target.value })} />
            </label>
            <div className="grid-2" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Type</span>
                <select defaultValue={selected.type} onChange={(e) => onSave({ type: e.target.value })}>
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Status</span>
                <select defaultValue={selected.status} onChange={(e) => onSave({ status: e.target.value })}>
                  {TASK_STATUS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">Description</span>
              <textarea defaultValue={selected.description ?? ""} onBlur={(e) => onSave({ description: e.target.value })} />
            </label>
            <label className="field">
              <span className="label">Project</span>
              <select defaultValue={selected.projectId ?? ""} onChange={(e) => onSave({ projectId: e.target.value || null })}>
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Owner node</span>
              <select defaultValue={selected.ownerNodeId ?? ""} onChange={(e) => onSave({ ownerNodeId: e.target.value || null })}>
                <option value="">—</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.type})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Assign nodes</span>
              <select
                multiple
                defaultValue={Array.from(selectedAssignments())}
                onChange={(e) =>
                  onSave({
                    assignNodeIds: Array.from(e.target.selectedOptions).map((o) => o.value)
                  })
                }
                style={{ minHeight: 140 }}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.type})
                  </option>
                ))}
              </select>
            </label>

            <button className="button-secondary" type="button" disabled={busy} onClick={() => refresh()}>
              {busy ? "Working..." : "Refresh"}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <p className="muted">Select a task.</p>
        )}
      </div>
    </div>
  );
}

