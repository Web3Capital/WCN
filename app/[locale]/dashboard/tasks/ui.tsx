"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getApiErrorMessageFromJson } from "@/lib/api-error";
import { StatusBadge, FormCard, EmptyState } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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
const TASK_STATUS = [
  "DRAFT", "ASSIGNED", "IN_PROGRESS", "SUBMITTED",
  "ACCEPTED", "REWORK", "BLOCKED", "CANCELLED", "CLOSED",
  "OPEN", "WAITING_REVIEW", "DONE",
] as const;

export function TasksConsole({
  initial,
  projects,
  nodes,
  readOnly = false
}: {
  initial: TaskRow[];
  projects: ProjectRow[];
  nodes: NodeRow[];
  readOnly?: boolean;
}) {
  const { t } = useAutoTranslate();
  const [rows, setRows] = useState<TaskRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [showForm, setShowForm] = useState(false);
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
    if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
    setRows(data.data);
    if (!selectedId && data.data?.[0]?.id) setSelectedId(data.data[0].id);
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
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
      setCreate({ title: "", type: "EXECUTION", status: "OPEN", projectId: "", ownerNodeId: "", assignNodeIds: [] });
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
      const res = await fetch(`/api/tasks/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Save failed."));
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
        {!readOnly ? (
          <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Create task")}>
            <div className="form mb-14">
              <label className="field">
                <span className="label">{t("Title")}</span>
                <input value={create.title} onChange={(e) => setCreate((s) => ({ ...s, title: e.target.value }))} />
              </label>
              <div className="grid-3 gap-12">
                <label className="field">
                  <span className="label">{t("Type")}</span>
                  <select value={create.type} onChange={(e) => setCreate((s) => ({ ...s, type: e.target.value }))}>
                    {TASK_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="label">{t("Status")}</span>
                  <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                    {TASK_STATUS.map((v) => (
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
                <span className="label">{t("Project")}</span>
                <select
                  value={create.projectId}
                  onChange={(e) => setCreate((s) => ({ ...s, projectId: e.target.value }))}
                >
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Assign nodes (collaborators)")}</span>
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
                {busy ? t("Working...") : t("Create")}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </FormCard>
        ) : null}

        <div className="pill mb-10">
          {t("Tasks")} ({rows.length})
        </div>
        <div className="apps-list">
          {rows.map((r) => {
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                className="apps-row"
                data-active={active ? "true" : "false"}
                onClick={() => setSelectedId(r.id)}
              >
                <div className="flex items-center gap-10">
                  <span className={`status-dot ${r.status === "CLOSED" || r.status === "ACCEPTED" || r.status === "DONE" ? "status-dot-green" : r.status === "IN_PROGRESS" || r.status === "SUBMITTED" || r.status === "REWORK" ? "status-dot-amber" : r.status === "CANCELLED" || r.status === "BLOCKED" ? "status-dot-red" : ""}`} />
                  <div>
                    <Link href={`/dashboard/tasks/${r.id}`} className="font-bold" style={{ color: "var(--accent)" }} onClick={(e) => e.stopPropagation()}>{r.title}</Link>
                    <div className="muted text-sm">{r.type}</div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="pill mb-10">
          {t("Details")}
        </div>
        {selected ? (
          <div className="form">
            <label className="field">
              <span className="label">{t("Title")}</span>
              <input
                key={selected.id + "t"}
                defaultValue={selected.title}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ title: e.target.value })}
              />
            </label>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Type")}</span>
                <select
                  key={selected.id + "ty"}
                  defaultValue={selected.type}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ type: e.target.value })}
                >
                  {TASK_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Status")}</span>
                <select
                  key={selected.id + "st"}
                  defaultValue={selected.status}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ status: e.target.value })}
                >
                  {TASK_STATUS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">{t("Description")}</span>
              <textarea
                key={selected.id + "d"}
                defaultValue={selected.description ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ description: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="label">{t("Project")}</span>
              <select
                key={selected.id + "p"}
                defaultValue={selected.projectId ?? ""}
                disabled={readOnly}
                onChange={readOnly ? undefined : (e) => onSave({ projectId: e.target.value || null })}
              >
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Owner node")}</span>
              <select
                key={selected.id + "o"}
                defaultValue={selected.ownerNodeId ?? ""}
                disabled={readOnly}
                onChange={readOnly ? undefined : (e) => onSave({ ownerNodeId: e.target.value || null })}
              >
                <option value="">—</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.type})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Assign nodes")}</span>
              <select
                key={selected.id + "a"}
                multiple
                defaultValue={Array.from(selectedAssignments())}
                disabled={readOnly}
                onChange={
                  readOnly
                    ? undefined
                    : (e) =>
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
              {busy ? t("Working...") : t("Refresh")}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <EmptyState message={t("Select a task.")} />
        )}
      </div>
    </div>
  );
}
