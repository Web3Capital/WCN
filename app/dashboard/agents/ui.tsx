"use client";

import { useMemo, useState } from "react";

type NodeRow = { id: string; name: string; type: string };
type PermissionRow = { id: string; scope: string; canWrite: boolean; auditLevel: number };
type AgentRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  endpoint: string | null;
  ownerNodeId: string;
  permissions: PermissionRow[];
};

const AGENT_TYPES = ["DEAL", "RESEARCH", "GROWTH", "EXECUTION", "LIQUIDITY"] as const;

export function AgentsConsole({ initial, nodes }: { initial: AgentRow[]; nodes: NodeRow[] }) {
  const [rows, setRows] = useState<AgentRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [create, setCreate] = useState({ name: "", type: "EXECUTION", ownerNodeId: "", endpoint: "" });
  const [perm, setPerm] = useState({ scope: "tasks:read", canWrite: false, auditLevel: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/agents", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? "Failed to load agents.");
    setRows(data.agents);
    if (!selectedId && data.agents?.[0]?.id) setSelectedId(data.agents[0].id);
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: create.name,
          type: create.type,
          ownerNodeId: create.ownerNodeId,
          endpoint: create.endpoint || null
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Create failed.");
      await refresh();
      setCreate({ name: "", type: "EXECUTION", ownerNodeId: "", endpoint: "" });
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
      const res = await fetch(`/api/agents/${selected.id}`, {
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

  async function addPermission() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${selected.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perm)
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Add permission failed.");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Add permission failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePermission(permissionId: string) {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${selected.id}/permissions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Delete permission failed.");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Delete permission failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="apps-layout">
      <div>
        <div className="pill" style={{ marginBottom: 10 }}>
          Register agent
        </div>
        <div className="form" style={{ marginBottom: 14 }}>
          <label className="field">
            <span className="label">Name</span>
            <input value={create.name} onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Type</span>
              <select value={create.type} onChange={(e) => setCreate((s) => ({ ...s, type: e.target.value }))}>
                {AGENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Owner node</span>
              <select
                value={create.ownerNodeId}
                onChange={(e) => setCreate((s) => ({ ...s, ownerNodeId: e.target.value }))}
              >
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
            <span className="label">Endpoint (optional)</span>
            <input value={create.endpoint} onChange={(e) => setCreate((s) => ({ ...s, endpoint: e.target.value }))} />
          </label>
          <button className="button" type="button" disabled={busy || !create.name.trim() || !create.ownerNodeId} onClick={onCreate}>
            {busy ? "Working..." : "Create"}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="pill" style={{ marginBottom: 10 }}>
          Agents ({rows.length})
        </div>
        <div className="apps-list">
          {rows.map((a) => {
            const active = a.id === selectedId;
            return (
              <button
                key={a.id}
                type="button"
                className="apps-row"
                style={{ borderColor: active ? "color-mix(in oklab, var(--accent) 55%, var(--line))" : undefined }}
                onClick={() => setSelectedId(a.id)}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{a.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {a.type} · {a.status}
                  </div>
                </div>
                <div className="pill">{a.permissions?.length ?? 0} perms</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="pill" style={{ marginBottom: 10 }}>
          Agent details
        </div>
        {selected ? (
          <div className="form">
            <label className="field">
              <span className="label">Name</span>
              <input defaultValue={selected.name} onBlur={(e) => onSave({ name: e.target.value })} />
            </label>
            <div className="grid-2" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Status</span>
                <select defaultValue={selected.status} onChange={(e) => onSave({ status: e.target.value })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </label>
              <label className="field">
                <span className="label">Endpoint</span>
                <input defaultValue={selected.endpoint ?? ""} onBlur={(e) => onSave({ endpoint: e.target.value })} />
              </label>
            </div>

            <div className="pill" style={{ marginTop: 10 }}>
              Permissions
            </div>
            <div className="grid-3" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Scope</span>
                <input value={perm.scope} onChange={(e) => setPerm((s) => ({ ...s, scope: e.target.value }))} />
              </label>
              <label className="field">
                <span className="label">Audit level</span>
                <input
                  type="number"
                  value={perm.auditLevel}
                  onChange={(e) => setPerm((s) => ({ ...s, auditLevel: Number(e.target.value) }))}
                />
              </label>
              <label className="field">
                <span className="label">Can write</span>
                <select value={perm.canWrite ? "yes" : "no"} onChange={(e) => setPerm((s) => ({ ...s, canWrite: e.target.value === "yes" }))}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
            <button className="button-secondary" type="button" disabled={busy || !perm.scope.trim()} onClick={addPermission}>
              {busy ? "Working..." : "Add permission"}
            </button>

            <div className="apps-list" style={{ marginTop: 10 }}>
              {(selected.permissions ?? []).map((p) => (
                <div key={p.id} className="apps-row" style={{ cursor: "default" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.scope}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      audit {p.auditLevel} · {p.canWrite ? "write" : "read"}
                    </div>
                  </div>
                  <button className="button-secondary" type="button" disabled={busy} onClick={() => deletePermission(p.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {error ? <p className="form-error">{error}</p> : null}
            <button className="button-secondary" type="button" disabled={busy} onClick={() => refresh()}>
              Refresh
            </button>
          </div>
        ) : (
          <p className="muted">Select an agent.</p>
        )}
      </div>
    </div>
  );
}

