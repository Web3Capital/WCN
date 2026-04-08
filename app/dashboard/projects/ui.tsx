"use client";

import { useMemo, useState } from "react";

type NodeRow = { id: string; name: string; type: string; status: string };
type ProjectRow = {
  id: string;
  status: string;
  name: string;
  stage: string;
  sector: string | null;
  website: string | null;
  pitchUrl: string | null;
  fundraisingNeed: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactTelegram: string | null;
  description: string | null;
  nodeId: string | null;
};

const PROJECT_STATUS = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ARCHIVED"] as const;
const PROJECT_STAGE = ["IDEA", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PUBLIC", "OTHER"] as const;

export function ProjectsConsole({ initial, nodes }: { initial: ProjectRow[]; nodes: NodeRow[] }) {
  const [rows, setRows] = useState<ProjectRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [create, setCreate] = useState({
    name: "",
    status: "SUBMITTED",
    stage: "OTHER",
    nodeId: ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/projects", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? "Failed to load projects.");
    setRows(data.projects);
    if (!selectedId && data.projects?.[0]?.id) setSelectedId(data.projects[0].id);
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: create.name,
          status: create.status,
          stage: create.stage,
          nodeId: create.nodeId || null
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Create failed.");
      await refresh();
      setCreate({ name: "", status: "SUBMITTED", stage: "OTHER", nodeId: "" });
    } catch (e: any) {
      setError(e?.message ?? "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(patch: Partial<ProjectRow>) {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${selected.id}`, {
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
          Create project
        </div>
        <div className="form" style={{ marginBottom: 14 }}>
          <label className="field">
            <span className="label">Name</span>
            <input value={create.name} onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <div className="grid-3" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Status</span>
              <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                {PROJECT_STATUS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Stage</span>
              <select value={create.stage} onChange={(e) => setCreate((s) => ({ ...s, stage: e.target.value }))}>
                {PROJECT_STAGE.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                    {n.name} ({n.type})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="button" type="button" disabled={busy || !create.name.trim()} onClick={onCreate}>
            {busy ? "Working..." : "Create"}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="pill" style={{ marginBottom: 10 }}>
          Projects ({rows.length})
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
                  <div style={{ fontWeight: 800 }}>{r.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {r.status} · {r.stage}
                  </div>
                </div>
                <div className="pill">{r.sector || "—"}</div>
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
              <span className="label">Name</span>
              <input defaultValue={selected.name} onBlur={(e) => onSave({ name: e.target.value })} />
            </label>
            <div className="grid-2" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Status</span>
                <select defaultValue={selected.status} onChange={(e) => onSave({ status: e.target.value })}>
                  {PROJECT_STATUS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Stage</span>
                <select defaultValue={selected.stage} onChange={(e) => onSave({ stage: e.target.value })}>
                  {PROJECT_STAGE.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">Sector</span>
              <input defaultValue={selected.sector ?? ""} onBlur={(e) => onSave({ sector: e.target.value })} />
            </label>
            <label className="field">
              <span className="label">Website</span>
              <input defaultValue={selected.website ?? ""} onBlur={(e) => onSave({ website: e.target.value })} />
            </label>
            <label className="field">
              <span className="label">Pitch URL</span>
              <input defaultValue={selected.pitchUrl ?? ""} onBlur={(e) => onSave({ pitchUrl: e.target.value })} />
            </label>
            <label className="field">
              <span className="label">Fundraising need</span>
              <textarea
                defaultValue={selected.fundraisingNeed ?? ""}
                onBlur={(e) => onSave({ fundraisingNeed: e.target.value })}
              />
            </label>
            <div className="grid-3" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Contact name</span>
                <input defaultValue={selected.contactName ?? ""} onBlur={(e) => onSave({ contactName: e.target.value })} />
              </label>
              <label className="field">
                <span className="label">Email</span>
                <input
                  defaultValue={selected.contactEmail ?? ""}
                  onBlur={(e) => onSave({ contactEmail: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">Telegram</span>
                <input
                  defaultValue={selected.contactTelegram ?? ""}
                  onBlur={(e) => onSave({ contactTelegram: e.target.value })}
                />
              </label>
            </div>
            <label className="field">
              <span className="label">Node</span>
              <select defaultValue={selected.nodeId ?? ""} onChange={(e) => onSave({ nodeId: e.target.value || null })}>
                <option value="">—</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.type})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">Description</span>
              <textarea
                defaultValue={selected.description ?? ""}
                onBlur={(e) => onSave({ description: e.target.value })}
              />
            </label>
            <button className="button-secondary" type="button" disabled={busy} onClick={() => refresh()}>
              {busy ? "Working..." : "Refresh"}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <p className="muted">Select a project.</p>
        )}
      </div>
    </div>
  );
}

