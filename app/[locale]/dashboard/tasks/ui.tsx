"use client";

import { useMemo, useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { StatusBadge, FormCard, EmptyState } from "../_components";
import { FilterToolbar } from "../_components/filter-toolbar";
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
  project?: { id: string; name: string } | null;
  ownerNodeId: string | null;
  ownerNode?: { id: string; name: string } | null;
  dueAt: string | null;
  createdAt?: string;
  assignments?: Array<{ nodeId: string }>;
};

const TASK_TYPES = ["FUNDRAISING", "GROWTH", "RESOURCE", "LIQUIDITY", "RESEARCH", "EXECUTION", "OTHER"] as const;
const TASK_STATUS = [
  "DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "SUBMITTED",
  "WAITING_REVIEW", "ACCEPTED", "REWORK", "BLOCKED", "DONE", "CANCELLED", "CLOSED",
] as const;

const STATUS_FILTERS = ["ALL", ...TASK_STATUS] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type SortKey = "title" | "status" | "type" | "project" | "ownerNode" | "dueAt" | "createdAt";
type SortDir = "asc" | "desc";

function statusDotClass(status: string): string {
  if (status === "CLOSED" || status === "ACCEPTED" || status === "DONE") return "status-dot-green";
  if (status === "CANCELLED" || status === "BLOCKED") return "status-dot-red";
  if (status === "IN_PROGRESS" || status === "SUBMITTED" || status === "REWORK" || status === "WAITING_REVIEW") return "status-dot-amber";
  if (status === "ASSIGNED" || status === "OPEN") return "status-dot-accent";
  return "";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDue(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  if (days <= 7) return `${days}d left`;
  return d.toLocaleDateString();
}

export function TasksConsole({
  initial,
  projects,
  nodes,
  readOnly = false,
}: {
  initial: TaskRow[];
  projects: ProjectRow[];
  nodes: NodeRow[];
  readOnly?: boolean;
}) {
  const { t } = useAutoTranslate();
  const router = useRouter();
  const [rows, setRows] = useState<TaskRow[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showForm, setShowForm] = useState(false);
  const [create, setCreate] = useState({
    title: "",
    type: "EXECUTION",
    status: "OPEN",
    projectId: "",
    ownerNodeId: "",
    assignNodeIds: [] as string[],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "ALL") list = list.filter((r) => r.status === statusFilter);
    if (typeFilter !== "ALL") list = list.filter((r) => r.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.project?.name ?? "").toLowerCase().includes(q) ||
          (r.ownerNode?.name ?? "").toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "title") { av = a.title.toLowerCase(); bv = b.title.toLowerCase(); }
      else if (sortKey === "status") { av = a.status; bv = b.status; }
      else if (sortKey === "type") { av = a.type; bv = b.type; }
      else if (sortKey === "project") { av = (a.project?.name ?? "").toLowerCase(); bv = (b.project?.name ?? "").toLowerCase(); }
      else if (sortKey === "ownerNode") { av = (a.ownerNode?.name ?? "").toLowerCase(); bv = (b.ownerNode?.name ?? "").toLowerCase(); }
      else if (sortKey === "dueAt") { av = a.dueAt ?? ""; bv = b.dueAt ?? ""; }
      else if (sortKey === "createdAt") { av = a.createdAt ?? ""; bv = b.createdAt ?? ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, statusFilter, typeFilter, search, sortKey, sortDir]);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else { setSortKey(key); setSortDir("asc"); }
    },
    [sortKey]
  );

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error(`Tasks fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Failed to load tasks."));
      setRows(data.data ?? []);
    } catch (err) {
      console.error("[Tasks] refresh failed", err);
    } finally {
      setLoading(false);
    }
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
          assignNodeIds: create.assignNodeIds,
        }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Create failed."));
      await refresh();
      setCreate({ title: "", type: "EXECUTION", status: "OPEN", projectId: "", ownerNodeId: "", assignNodeIds: [] });
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? t("Create failed."));
    } finally {
      setBusy(false);
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  const hasFilters = statusFilter !== "ALL" || typeFilter !== "ALL" || search.trim();

  return (
    <div className="flex-col gap-16">
      {!readOnly && (
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Create task")}>
          <div className="form mb-14">
            <label className="field">
              <span className="label">{t("Title")} *</span>
              <input value={create.title} onChange={(e) => setCreate((s) => ({ ...s, title: e.target.value }))} />
            </label>
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Type")}</span>
                <select value={create.type} onChange={(e) => setCreate((s) => ({ ...s, type: e.target.value }))}>
                  {TASK_TYPES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Status")}</span>
                <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                  {TASK_STATUS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Owner node")}</span>
                <select value={create.ownerNodeId} onChange={(e) => setCreate((s) => ({ ...s, ownerNodeId: e.target.value }))}>
                  <option value="">—</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Project")}</span>
                <select value={create.projectId} onChange={(e) => setCreate((s) => ({ ...s, projectId: e.target.value }))}>
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Assign nodes")}</span>
                <select
                  multiple
                  value={create.assignNodeIds}
                  onChange={(e) =>
                    setCreate((s) => ({
                      ...s,
                      assignNodeIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                    }))
                  }
                  style={{ minHeight: 100 }}
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="button" type="button" disabled={busy || !create.title.trim()} onClick={onCreate}>
              {busy ? t("Working...") : t("Create")}
            </button>
            {error && <p className="form-error">{error}</p>}
          </div>
        </FormCard>
      )}

      <div className="flex items-center gap-12 flex-wrap">
        <div className="flex items-center gap-8" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              type="search"
              placeholder={t("Search tasks...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: "100%" }}
            />
          </div>
          {hasFilters && (
            <button
              className="button-secondary text-xs"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => { setSearch(""); setStatusFilter("ALL"); setTypeFilter("ALL"); }}
            >
              <X size={12} /> {t("Clear")}
            </button>
          )}
        </div>
        <div className="flex items-center gap-8">
          <select
            className="text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: 120 }}
          >
            <option value="ALL">{t("All types")}</option>
            {TASK_TYPES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span className="muted text-sm">{filtered.length} {t("tasks")}</span>
        </div>
      </div>

      <FilterToolbar<StatusFilter>
        filters={STATUS_FILTERS as unknown as readonly StatusFilter[]}
        active={statusFilter}
        onChange={setStatusFilter}
        counts={statusCounts as any}
        totalLabel={t("All")}
        totalCount={rows.length}
      />

      {loading && (
        <div className="loading-state" style={{ padding: "24px 0" }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <EmptyState
          message={hasFilters ? t("No tasks match your filters.") : t("No tasks yet. Create your first task.")}
        />
      ) : !loading ? (
        <div className="data-table-wrap reveal">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th onClick={() => toggleSort("title")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Title")} <SortIcon col="title" /></span>
                </th>
                <th onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Status")} <SortIcon col="status" /></span>
                </th>
                <th onClick={() => toggleSort("type")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Type")} <SortIcon col="type" /></span>
                </th>
                <th onClick={() => toggleSort("project")} style={{ cursor: "pointer" }} className="hide-mobile">
                  <span className="flex items-center gap-4">{t("Project")} <SortIcon col="project" /></span>
                </th>
                <th className="hide-mobile">{t("Node")}</th>
                <th onClick={() => toggleSort("dueAt")} style={{ cursor: "pointer" }} className="hide-mobile">
                  <span className="flex items-center gap-4">{t("Due")} <SortIcon col="dueAt" /></span>
                </th>
                <th onClick={() => toggleSort("createdAt")} style={{ cursor: "pointer" }} className="hide-mobile">
                  <span className="flex items-center gap-4">{t("Created")} <SortIcon col="createdAt" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="data-table-clickable"
                  onClick={() => router.push(`/dashboard/tasks/${r.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/tasks/${r.id}`); }}
                >
                  <td><span className={`status-dot ${statusDotClass(r.status)}`} /></td>
                  <td><span className="font-semibold">{r.title}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><span className="badge text-xs">{r.type}</span></td>
                  <td className="hide-mobile">
                    <span className="muted">{r.project?.name || "—"}</span>
                  </td>
                  <td className="hide-mobile">
                    <span className="muted">{r.ownerNode?.name || "—"}</span>
                  </td>
                  <td className="hide-mobile">
                    {r.dueAt ? (
                      <span className={`text-xs ${new Date(r.dueAt).getTime() < Date.now() ? "font-semibold" : "muted"}`}
                        style={new Date(r.dueAt).getTime() < Date.now() ? { color: "var(--red)" } : undefined}
                      >
                        {formatDue(r.dueAt)}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="hide-mobile">
                    <span className="muted text-xs">{r.createdAt ? relativeTime(r.createdAt) : "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
