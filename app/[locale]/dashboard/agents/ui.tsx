"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { Search, ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import { StatusBadge, FormCard, EmptyState } from "../_components";
import { FilterToolbar } from "../_components/filter-toolbar";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type NodeRow = { id: string; name: string; type: string };
type AgentRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  endpoint: string | null;
  ownerNodeId: string;
  ownerNode?: { id: string; name: string } | null;
  createdAt?: string;
  _count?: { runs: number; logs: number; permissions: number };
};

const AGENT_TYPES = ["DEAL", "RESEARCH", "GROWTH", "EXECUTION", "LIQUIDITY"] as const;
const AGENT_STATUS = ["ACTIVE", "DISABLED", "SUSPENDED", "FROZEN"] as const;
const STATUS_FILTERS = ["ALL", ...AGENT_STATUS] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type SortKey = "name" | "type" | "status" | "createdAt";
type SortDir = "asc" | "desc";

function statusDotClass(status: string): string {
  if (status === "ACTIVE") return "status-dot-green";
  if (status === "FROZEN" || status === "SUSPENDED") return "status-dot-red";
  if (status === "DISABLED") return "status-dot-amber";
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

export function AgentsConsole({
  initial,
  nodes,
  readOnly = false,
}: {
  initial: AgentRow[];
  nodes: NodeRow[];
  readOnly?: boolean;
}) {
  const { t } = useAutoTranslate();
  const router = useRouter();
  const [rows, setRows] = useState<AgentRow[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showForm, setShowForm] = useState(false);
  const [create, setCreate] = useState({ name: "", type: "EXECUTION", ownerNodeId: "", endpoint: "" });
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
          r.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.ownerNode?.name ?? "").toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (sortKey === "type") { av = a.type; bv = b.type; }
      else if (sortKey === "status") { av = a.status; bv = b.status; }
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
    [sortKey],
  );

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents", { cache: "no-store" });
      if (!res.ok) throw new Error(`Agents fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Failed to load agents."));
      setRows(data.data ?? []);
    } catch (err) {
      console.error("[Agents] refresh failed", err);
    } finally {
      setLoading(false);
    }
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
          endpoint: create.endpoint || null,
        }),
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

  async function onDelete(id: string, name: string) {
    if (!confirm(t("Delete agent \"{name}\"?").replace("{name}", name))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Delete failed."));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Delete failed."));
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
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Register agent")}>
          <div className="form mb-14">
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Name")} *</span>
                <input value={create.name} onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))} />
              </label>
              <label className="field">
                <span className="label">{t("Type")}</span>
                <select value={create.type} onChange={(e) => setCreate((s) => ({ ...s, type: e.target.value }))}>
                  {AGENT_TYPES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Owner node")} *</span>
                <select value={create.ownerNodeId} onChange={(e) => setCreate((s) => ({ ...s, ownerNodeId: e.target.value }))}>
                  <option value="">—</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">{t("Endpoint (optional)")}</span>
              <input value={create.endpoint} onChange={(e) => setCreate((s) => ({ ...s, endpoint: e.target.value }))} placeholder="https://" />
            </label>
            <button className="button" type="button" disabled={busy || !create.name.trim() || !create.ownerNodeId} onClick={onCreate}>
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
              placeholder={t("Search agents...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: "100%" }}
            />
          </div>
          {hasFilters && (
            <button className="button-secondary text-xs" style={{ whiteSpace: "nowrap" }} onClick={() => { setSearch(""); setStatusFilter("ALL"); setTypeFilter("ALL"); }}>
              <X size={12} /> {t("Clear")}
            </button>
          )}
        </div>
        <div className="flex items-center gap-8">
          <select
            className="text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: 100 }}
          >
            <option value="ALL">{t("All types")}</option>
            {AGENT_TYPES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span className="muted text-sm">{filtered.length} {t("agents")}</span>
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
          message={hasFilters ? t("No agents match your filters.") : t("No agents yet. Register your first agent.")}
        />
      ) : !loading ? (
        <div className="data-table-wrap reveal">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th onClick={() => toggleSort("name")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Name")} <SortIcon col="name" /></span>
                </th>
                <th onClick={() => toggleSort("type")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Type")} <SortIcon col="type" /></span>
                </th>
                <th onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Status")} <SortIcon col="status" /></span>
                </th>
                <th className="hide-mobile">{t("Owner Node")}</th>
                <th className="hide-mobile">{t("Runs")}</th>
                <th onClick={() => toggleSort("createdAt")} style={{ cursor: "pointer" }} className="hide-mobile">
                  <span className="flex items-center gap-4">{t("Created")} <SortIcon col="createdAt" /></span>
                </th>
                {!readOnly && <th style={{ width: 40 }} />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="data-table-clickable"
                  onClick={() => router.push(`/dashboard/agents/${r.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/agents/${r.id}`); }}
                >
                  <td><span className={`status-dot ${statusDotClass(r.status)}`} /></td>
                  <td><span className="font-semibold">{r.name}</span></td>
                  <td><span className="badge text-xs">{r.type}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="hide-mobile"><span className="muted">{r.ownerNode?.name || "—"}</span></td>
                  <td className="hide-mobile"><span className="muted">{r._count?.runs ?? "—"}</span></td>
                  <td className="hide-mobile">
                    <span className="muted text-xs">{r.createdAt ? relativeTime(r.createdAt) : "—"}</span>
                  </td>
                  {!readOnly && (
                    <td>
                      <button
                        className="button-secondary text-xs"
                        style={{ color: "var(--red)", padding: "4px 6px", minHeight: "auto" }}
                        onClick={(e) => { e.stopPropagation(); onDelete(r.id, r.name); }}
                        title={t("Delete")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
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
