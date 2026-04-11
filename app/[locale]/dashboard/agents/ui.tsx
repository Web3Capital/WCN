"use client";

import { useMemo, useState } from "react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { StatusBadge, FormCard, EmptyState } from "../_components";

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

export function AgentsConsole({
  initial,
  nodes,
  readOnly = false
}: {
  initial: AgentRow[];
  nodes: NodeRow[];
  readOnly?: boolean;
}) {
  const { t } = useAutoTranslate();
  const [rows, setRows] = useState<AgentRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [showForm, setShowForm] = useState(false);
  const [create, setCreate] = useState({ name: "", type: "EXECUTION", ownerNodeId: "", endpoint: "" });
  const [perm, setPerm] = useState({ scope: "tasks:read", canWrite: false, auditLevel: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/agents", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? t("Failed to load agents."));
    const list = data.data ?? [];
    setRows(list);
    if (!selectedId && list[0]?.id) setSelectedId(list[0].id);
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
      if (!data?.ok) throw new Error(data?.error ?? t("Create failed."));
      await refresh();
      setCreate({ name: "", type: "EXECUTION", ownerNodeId: "", endpoint: "" });
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? t("Create failed."));
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
      if (!data?.ok) throw new Error(data?.error ?? t("Save failed."));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Save failed."));
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
      if (!data?.ok) throw new Error(data?.error ?? t("Add permission failed."));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Add permission failed."));
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
      if (!data?.ok) throw new Error(data?.error ?? t("Delete permission failed."));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Delete permission failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="apps-layout">
      <div>
        {!readOnly ? (
          <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Register agent")}>
            <div className="form mb-14">
              <label className="field">
                <span className="label">{t("Name")}</span>
                <input value={create.name} onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))} />
              </label>
              <div className="grid-2 gap-12">
                <label className="field">
                  <span className="label">{t("Type")}</span>
                  <select value={create.type} onChange={(e) => setCreate((s) => ({ ...s, type: e.target.value }))}>
                    {AGENT_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="label">{t("Owner node")}</span>
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
                <span className="label">{t("Endpoint (optional)")}</span>
                <input value={create.endpoint} onChange={(e) => setCreate((s) => ({ ...s, endpoint: e.target.value }))} />
              </label>
              <button
                className="button"
                type="button"
                disabled={busy || !create.name.trim() || !create.ownerNodeId}
                onClick={onCreate}
              >
                {busy ? t("Working...") : t("Create")}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </FormCard>
        ) : null}

        <div className="pill mb-10">
          {t("Agents")} ({rows.length})
        </div>
        <div className="apps-list">
          {rows.map((a) => {
            const active = a.id === selectedId;
            return (
              <button
                key={a.id}
                type="button"
                className="apps-row"
                data-active={active ? "true" : "false"}
                onClick={() => setSelectedId(a.id)}
              >
                <div className="flex items-center gap-10">
                  <span className={`status-dot ${a.status === "ACTIVE" ? "status-dot-green" : a.status === "SUSPENDED" ? "status-dot-red" : "status-dot-amber"}`} />
                  <div>
                    <div className="font-bold">{a.name}</div>
                    <div className="muted text-sm">{a.type}</div>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="pill mb-10">
          {t("Agent details")}
        </div>
        {selected ? (
          <div className="form">
            <label className="field">
              <span className="label">{t("Name")}</span>
              <input
                key={selected.id + "n"}
                defaultValue={selected.name}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ name: e.target.value })}
              />
            </label>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Status")}</span>
                <select
                  key={selected.id + "s"}
                  defaultValue={selected.status}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ status: e.target.value })}
                >
                  <option value="ACTIVE">{t("ACTIVE")}</option>
                  <option value="DISABLED">{t("DISABLED")}</option>
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Endpoint")}</span>
                <input
                  key={selected.id + "e"}
                  defaultValue={selected.endpoint ?? ""}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onBlur={readOnly ? undefined : (e) => onSave({ endpoint: e.target.value })}
                />
              </label>
            </div>

            <div className="pill mt-10">
              {t("Permissions")}
            </div>
            {!readOnly ? (
              <>
                <div className="grid-3 gap-12">
                  <label className="field">
                    <span className="label">{t("Scope")}</span>
                    <input value={perm.scope} onChange={(e) => setPerm((s) => ({ ...s, scope: e.target.value }))} />
                  </label>
                  <label className="field">
                    <span className="label">{t("Audit level")}</span>
                    <input
                      type="number"
                      value={perm.auditLevel}
                      onChange={(e) => setPerm((s) => ({ ...s, auditLevel: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="field">
                    <span className="label">{t("Can write")}</span>
                    <select
                      value={perm.canWrite ? "yes" : "no"}
                      onChange={(e) => setPerm((s) => ({ ...s, canWrite: e.target.value === "yes" }))}
                    >
                      <option value="no">{t("No")}</option>
                      <option value="yes">{t("Yes")}</option>
                    </select>
                  </label>
                </div>
                <button className="button-secondary" type="button" disabled={busy || !perm.scope.trim()} onClick={addPermission}>
                  {busy ? t("Working...") : t("Add permission")}
                </button>
              </>
            ) : null}

            <div className="apps-list mt-10">
              {(selected.permissions ?? []).map((p) => (
                <div key={p.id} className="apps-row" style={{ cursor: "default" }}>
                  <div>
                    <div className="font-bold">{p.scope}</div>
                    <div className="muted text-sm">
                      {t("audit")} {p.auditLevel} · {p.canWrite ? t("write") : t("read")}
                    </div>
                  </div>
                  {!readOnly ? (
                    <button className="button-secondary" type="button" disabled={busy} onClick={() => deletePermission(p.id)}>
                      {t("Remove")}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            {error ? <p className="form-error">{error}</p> : null}
            <button className="button-secondary" type="button" disabled={busy} onClick={() => refresh()}>
              {t("Refresh")}
            </button>
          </div>
        ) : (
          <EmptyState message={t("Select an agent.")} />
        )}
      </div>
    </div>
  );
}
