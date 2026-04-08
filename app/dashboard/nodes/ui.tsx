"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type NodeRow = {
  id: string;
  type: string;
  status: string;
  name: string;
  description: string | null;
  tags: string[];
  region: string | null;
  city: string | null;
  jurisdiction: string | null;
  level: number;
  ownerUserId: string | null;
  createdAt: string | Date;
};

const NODE_TYPES = ["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"] as const;
const NODE_STATUS = ["DRAFT", "SUBMITTED", "ACTIVE", "SUSPENDED", "REJECTED"] as const;

export function NodesConsole({ initial, readOnly = false }: { initial: NodeRow[]; readOnly?: boolean }) {
  const [rows, setRows] = useState<NodeRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [creating, setCreating] = useState(false);
  const [create, setCreate] = useState({
    name: "",
    type: "CITY",
    status: "SUBMITTED",
    tags: "",
    region: "",
    city: "",
    jurisdiction: ""
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/nodes", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? "Failed to load nodes.");
    setRows(data.nodes);
    if (!selectedId && data.nodes?.[0]?.id) setSelectedId(data.nodes[0].id);
  }

  async function onCreate() {
    setError(null);
    setCreating(true);
    try {
      const tags = create.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: create.name,
          type: create.type,
          status: create.status,
          tags,
          region: create.region || null,
          city: create.city || null,
          jurisdiction: create.jurisdiction || null
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Create failed.");
      await refresh();
      setCreate({ name: "", type: "CITY", status: "SUBMITTED", tags: "", region: "", city: "", jurisdiction: "" });
    } catch (e: any) {
      setError(e?.message ?? "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function onSave(patch: Partial<NodeRow>) {
    if (!selected) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/nodes/${selected.id}`, {
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
      setSaving(false);
    }
  }

  return (
    <div className="apps-layout">
      <div>
        {!readOnly ? (
          <>
            <div className="pill" style={{ marginBottom: 10 }}>
              Create node
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
                    {NODE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="label">Status</span>
                  <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                    {NODE_STATUS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span className="label">Tags (comma separated)</span>
                <input value={create.tags} onChange={(e) => setCreate((s) => ({ ...s, tags: e.target.value }))} />
              </label>
              <div className="grid-3" style={{ gap: 12 }}>
                <label className="field">
                  <span className="label">Region</span>
                  <input value={create.region} onChange={(e) => setCreate((s) => ({ ...s, region: e.target.value }))} />
                </label>
                <label className="field">
                  <span className="label">City</span>
                  <input value={create.city} onChange={(e) => setCreate((s) => ({ ...s, city: e.target.value }))} />
                </label>
                <label className="field">
                  <span className="label">Jurisdiction</span>
                  <input
                    value={create.jurisdiction}
                    onChange={(e) => setCreate((s) => ({ ...s, jurisdiction: e.target.value }))}
                  />
                </label>
              </div>
              <button className="button" type="button" disabled={creating || !create.name.trim()} onClick={onCreate}>
                {creating ? "Creating..." : "Create"}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </>
        ) : null}

        <div className="pill" style={{ marginBottom: 10 }}>
          Nodes ({rows.length})
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
                  <Link href={`/dashboard/nodes/${r.id}`} style={{ fontWeight: 800, color: "var(--accent)" }} onClick={(e) => e.stopPropagation()}>
                    {r.name}
                  </Link>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {r.type} · {r.status} · L{r.level}
                  </div>
                </div>
                <div className="pill">{r.city || r.region || "—"}</div>
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
              <input
                key={selected.id + selected.name}
                defaultValue={selected.name}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ name: e.target.value })}
              />
            </label>
            <div className="grid-2" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Type</span>
                <select
                  key={selected.id + "t"}
                  defaultValue={selected.type}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ type: e.target.value })}
                >
                  {NODE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Status</span>
                <select
                  key={selected.id + "s"}
                  defaultValue={selected.status}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ status: e.target.value })}
                >
                  {NODE_STATUS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">Description</span>
              <textarea
                key={selected.id + "d"}
                defaultValue={selected.description ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ description: e.target.value })}
              />
            </label>
            <div className="grid-3" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Region</span>
                <input
                  key={selected.id + "r"}
                  defaultValue={selected.region ?? ""}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onBlur={readOnly ? undefined : (e) => onSave({ region: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">City</span>
                <input
                  key={selected.id + "c"}
                  defaultValue={selected.city ?? ""}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onBlur={readOnly ? undefined : (e) => onSave({ city: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">Jurisdiction</span>
                <input
                  key={selected.id + "j"}
                  defaultValue={selected.jurisdiction ?? ""}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onBlur={readOnly ? undefined : (e) => onSave({ jurisdiction: e.target.value })}
                />
              </label>
            </div>
            <label className="field">
              <span className="label">Level</span>
              <input
                key={selected.id + "l"}
                type="number"
                defaultValue={selected.level}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ level: Number(e.target.value) })}
              />
            </label>
            <button className="button-secondary" type="button" disabled={saving} onClick={() => refresh()}>
              {saving ? "Saving..." : "Refresh"}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <p className="muted">Select a node.</p>
        )}
      </div>
    </div>
  );
}

