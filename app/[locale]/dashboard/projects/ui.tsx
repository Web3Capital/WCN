"use client";

import { useMemo, useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Search, Plus, ChevronDown, ChevronUp, Trash2, ExternalLink, X } from "lucide-react";
import { StatusBadge, FormCard, EmptyState } from "../_components";
import { FilterToolbar } from "../_components/filter-toolbar";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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
  node?: { id: string; name: string } | null;
  internalScore: number | null;
  internalNotes: string | null;
  confidentialityLevel: string;
  riskTags: string[];
  createdAt?: string;
};

const PROJECT_STATUS = [
  "DRAFT", "SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM",
  "ACTIVE", "ON_HOLD", "APPROVED", "REJECTED", "ARCHIVED",
] as const;
const PROJECT_STAGE = ["IDEA", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PUBLIC", "OTHER"] as const;

const STATUS_FILTERS = ["ALL", ...PROJECT_STATUS] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

type SortKey = "name" | "status" | "stage" | "sector" | "createdAt" | "internalScore";
type SortDir = "asc" | "desc";

function statusDotClass(status: string): string {
  if (status === "APPROVED" || status === "ACTIVE") return "status-dot-green";
  if (status === "REJECTED" || status === "ARCHIVED") return "status-dot-red";
  if (status === "SUBMITTED" || status === "SCREENED" || status === "ON_HOLD") return "status-dot-amber";
  if (status === "IN_DEAL_ROOM" || status === "CURATED") return "status-dot-accent";
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

export function ProjectsConsole({
  initial,
  nodes,
  readOnly = false
}: {
  initial: ProjectRow[];
  nodes: NodeRow[];
  readOnly?: boolean;
}) {
  const { t } = useAutoTranslate();
  const router = useRouter();
  const [rows, setRows] = useState<ProjectRow[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showForm, setShowForm] = useState(false);
  const [create, setCreate] = useState({
    name: "", stage: "OTHER", sector: "", nodeId: "", fundraisingNeed: "",
    website: "", pitchUrl: "", contactName: "", contactEmail: "", contactTelegram: "", description: "",
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
    if (stageFilter !== "ALL") list = list.filter((r) => r.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        (r.sector ?? "").toLowerCase().includes(q) ||
        (r.node?.name ?? "").toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (sortKey === "name") { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (sortKey === "status") { av = a.status; bv = b.status; }
      else if (sortKey === "stage") { av = a.stage; bv = b.stage; }
      else if (sortKey === "sector") { av = (a.sector ?? "").toLowerCase(); bv = (b.sector ?? "").toLowerCase(); }
      else if (sortKey === "createdAt") { av = a.createdAt ?? ""; bv = b.createdAt ?? ""; }
      else if (sortKey === "internalScore") { av = a.internalScore ?? -1; bv = b.internalScore ?? -1; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, statusFilter, stageFilter, search, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error(`Projects fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Failed to load projects."));
      setRows(data.data?.projects ?? []);
    } catch (err) {
      console.error("[Projects] refresh failed", err);
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: create.name, stage: create.stage,
          sector: create.sector || null, nodeId: create.nodeId || null,
          fundraisingNeed: create.fundraisingNeed || null,
          website: create.website || null, pitchUrl: create.pitchUrl || null,
          contactName: create.contactName || null, contactEmail: create.contactEmail || null,
          contactTelegram: create.contactTelegram || null, description: create.description || null,
        }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Create failed."));
      await refresh();
      setCreate({ name: "", stage: "OTHER", sector: "", nodeId: "", fundraisingNeed: "", website: "", pitchUrl: "", contactName: "", contactEmail: "", contactTelegram: "", description: "" });
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? t("Create failed."));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(t("Delete project \"{name}\"?").replace("{name}", name))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
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

  const hasFilters = statusFilter !== "ALL" || stageFilter !== "ALL" || search.trim();

  return (
    <div className="flex-col gap-16">
      {!readOnly && (
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Create project")}>
          <div className="form mb-14">
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Name")} *</span>
                <input value={create.name} onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))} />
              </label>
              <label className="field">
                <span className="label">{t("Stage")}</span>
                <select value={create.stage} onChange={(e) => setCreate((s) => ({ ...s, stage: e.target.value }))}>
                  {PROJECT_STAGE.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Sector")}</span>
                <input value={create.sector} onChange={(e) => setCreate((s) => ({ ...s, sector: e.target.value }))} placeholder="AI x Crypto, DeFi..." />
              </label>
            </div>
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Fundraising need")}</span>
                <input value={create.fundraisingNeed} onChange={(e) => setCreate((s) => ({ ...s, fundraisingNeed: e.target.value }))} placeholder="$4M Seed" />
              </label>
              <label className="field">
                <span className="label">{t("Website")}</span>
                <input type="url" value={create.website} onChange={(e) => setCreate((s) => ({ ...s, website: e.target.value }))} placeholder="https://" />
              </label>
              <label className="field">
                <span className="label">{t("Pitch URL")}</span>
                <input type="url" value={create.pitchUrl} onChange={(e) => setCreate((s) => ({ ...s, pitchUrl: e.target.value }))} placeholder="https://" />
              </label>
            </div>
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Contact name")}</span>
                <input value={create.contactName} onChange={(e) => setCreate((s) => ({ ...s, contactName: e.target.value }))} />
              </label>
              <label className="field">
                <span className="label">{t("Email")}</span>
                <input type="email" value={create.contactEmail} onChange={(e) => setCreate((s) => ({ ...s, contactEmail: e.target.value }))} />
              </label>
              <label className="field">
                <span className="label">{t("Telegram")}</span>
                <input value={create.contactTelegram} onChange={(e) => setCreate((s) => ({ ...s, contactTelegram: e.target.value }))} placeholder="@handle" />
              </label>
            </div>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Node")}</span>
                <select value={create.nodeId} onChange={(e) => setCreate((s) => ({ ...s, nodeId: e.target.value }))}>
                  <option value="">—</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Description")}</span>
                <textarea value={create.description} onChange={(e) => setCreate((s) => ({ ...s, description: e.target.value }))} rows={2} />
              </label>
            </div>
            <button className="button" type="button" disabled={busy || !create.name.trim()} onClick={onCreate}>
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
              placeholder={t("Search projects...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: "100%" }}
            />
          </div>
          {hasFilters && (
            <button className="button-secondary text-xs" style={{ whiteSpace: "nowrap" }} onClick={() => { setSearch(""); setStatusFilter("ALL"); setStageFilter("ALL"); }}>
              <X size={12} /> {t("Clear")}
            </button>
          )}
        </div>
        <div className="flex items-center gap-8">
          <select
            className="text-sm"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{ minWidth: 100 }}
          >
            <option value="ALL">{t("All stages")}</option>
            {PROJECT_STAGE.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <span className="muted text-sm">{filtered.length} {t("projects")}</span>
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
          message={hasFilters ? t("No projects match your filters.") : t("No projects yet. Create your first project.")}
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
                <th onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Status")} <SortIcon col="status" /></span>
                </th>
                <th onClick={() => toggleSort("stage")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Stage")} <SortIcon col="stage" /></span>
                </th>
                <th onClick={() => toggleSort("sector")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Sector")} <SortIcon col="sector" /></span>
                </th>
                <th className="hide-mobile">{t("Node")}</th>
                {!readOnly && (
                  <th onClick={() => toggleSort("internalScore")} style={{ cursor: "pointer" }} className="hide-mobile">
                    <span className="flex items-center gap-4">{t("Score")} <SortIcon col="internalScore" /></span>
                  </th>
                )}
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
                  onClick={() => router.push(`/dashboard/projects/${r.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/projects/${r.id}`); }}
                >
                  <td><span className={`status-dot ${statusDotClass(r.status)}`} /></td>
                  <td>
                    <span className="font-semibold">{r.name}</span>
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><span className="badge text-xs">{r.stage}</span></td>
                  <td><span className="muted">{r.sector || "—"}</span></td>
                  <td className="hide-mobile"><span className="muted">{r.node?.name || "—"}</span></td>
                  {!readOnly && (
                    <td className="hide-mobile">
                      {r.internalScore != null ? (
                        <span className="font-semibold">{r.internalScore}</span>
                      ) : <span className="muted">—</span>}
                    </td>
                  )}
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
