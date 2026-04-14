"use client";

import { useMemo, useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Search, ChevronDown, ChevronUp, X, Handshake, LayoutGrid, Table2, TrendingUp, Target, Layers } from "lucide-react";
import { StatusBadge, FormCard, EmptyState, FilterToolbar, StatCard, DashboardDistributionPie, DashboardPipelineBar } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type DealRow = {
  id: string;
  title: string;
  stage: string;
  description: string | null;
  nextAction: string | null;
  project: { id: string; name: string } | null;
  capital: { id: string; name: string } | null;
  leadNode: { id: string; name: string };
  _count: { participants: number; milestones: number; tasks: number };
  updatedAt: string;
  createdAt?: string;
};

const STAGES = [
  "ALL", "SOURCED", "MATCHED", "INTRO_SENT", "MEETING_DONE",
  "DD", "TERM_SHEET", "SIGNED", "FUNDED", "PASSED", "PAUSED",
] as const;
type StageFilter = typeof STAGES[number];

const DEAL_PIPELINE_STAGES = [
  "SOURCED", "MATCHED", "INTRO_SENT", "MEETING_DONE", "DD", "TERM_SHEET", "SIGNED", "FUNDED", "PASSED", "PAUSED",
] as const;
const DEAL_STAGE_COLORS: Record<string, string> = {
  SOURCED: "#94a3b8", MATCHED: "#f59e0b", INTRO_SENT: "#f59e0b", MEETING_DONE: "#a855f7",
  DD: "#a855f7", TERM_SHEET: "#a855f7", SIGNED: "#22c55e", FUNDED: "#22c55e",
  PASSED: "#ef4444", PAUSED: "#94a3b8",
};
const DEAL_CHART_PALETTE = ["#6366f1", "#8b5cf6", "#a78bfa", "#22c55e", "#f59e0b", "#ef4444", "#f97316", "#94a3b8"] as const;

type SortKey = "title" | "leadNode" | "stage" | "updatedAt";
type SortDir = "asc" | "desc";

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

function stageDotClass(stage: string): string {
  if (stage === "SIGNED" || stage === "FUNDED") return "status-dot-green";
  if (stage === "PASSED") return "status-dot-red";
  if (stage === "DD" || stage === "TERM_SHEET") return "status-dot-accent";
  if (stage === "PAUSED") return "status-dot-red";
  return "status-dot-amber";
}

export type DealConsoleStats = {
  total: number;
  inFlight: number;
  won: number;
  linked: number;
  stageCounts: Record<string, number>;
};

export function DealsConsole({
  initialDeals,
  nodes,
  projects,
  capitals,
  isAdmin,
  stats,
}: {
  initialDeals: DealRow[];
  nodes: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  capitals: { id: string; name: string }[];
  isAdmin: boolean;
  stats: DealConsoleStats;
}) {
  const { t } = useAutoTranslate();
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");

  const [create, setCreate] = useState({
    title: "", leadNodeId: nodes[0]?.id ?? "", projectId: "", capitalId: "", description: "",
  });

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of deals) c[d.stage] = (c[d.stage] || 0) + 1;
    return c;
  }, [deals]);

  const filtered = useMemo(() => {
    let list = deals;
    if (stageFilter !== "ALL") list = list.filter((d) => d.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        d.leadNode.name.toLowerCase().includes(q) ||
        (d.project?.name ?? "").toLowerCase().includes(q) ||
        (d.capital?.name ?? "").toLowerCase().includes(q) ||
        (d.nextAction ?? "").toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av: string = "", bv: string = "";
      if (sortKey === "title") { av = a.title.toLowerCase(); bv = b.title.toLowerCase(); }
      else if (sortKey === "leadNode") { av = a.leadNode.name.toLowerCase(); bv = b.leadNode.name.toLowerCase(); }
      else if (sortKey === "stage") { av = a.stage; bv = b.stage; }
      else if (sortKey === "updatedAt") { av = a.updatedAt; bv = b.updatedAt; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [deals, stageFilter, search, sortKey, sortDir]);

  const pipelineGroups = useMemo(() => {
    const g: Record<string, DealRow[]> = {};
    for (const s of DEAL_PIPELINE_STAGES) g[s] = filtered.filter((d) => d.stage === s);
    return g;
  }, [filtered]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/deals", { cache: "no-store" });
      if (!res.ok) throw new Error(`Deals fetch failed: ${res.status}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Failed to load deals."));
      setDeals(data.data ?? []);
    } catch (err) {
      console.error("[Deals] refresh failed", err);
    } finally {
      setLoading(false);
    }
  }

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: create.title,
          leadNodeId: create.leadNodeId,
          projectId: create.projectId || null,
          capitalId: create.capitalId || null,
          description: create.description || null,
        }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Create failed."));
      await refresh();
      setCreate({ title: "", leadNodeId: nodes[0]?.id ?? "", projectId: "", capitalId: "", description: "" });
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

  const hasFilters = stageFilter !== "ALL" || search.trim();

  return (
    <div className="flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("Total deals")} value={stats.total} icon={<Handshake size={18} />} />
        <StatCard label={t("In progress")} value={stats.inFlight} sub={t("Excl. funded / passed / paused")} icon={<TrendingUp size={18} />} />
        <StatCard label={t("Won / signed")} value={stats.won} icon={<Target size={18} />} />
        <StatCard label={t("Project + capital")} value={stats.linked} sub={t("Both sides linked")} icon={<Layers size={18} />} />
      </div>

      {isAdmin && Object.keys(stats.stageCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Stage distribution")}</h3>
            <DashboardDistributionPie data={stats.stageCounts} colorMap={DEAL_STAGE_COLORS} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={DEAL_PIPELINE_STAGES} data={stats.stageCounts} palette={DEAL_CHART_PALETTE} />
            <div className="flex gap-6 flex-wrap mt-12">
              {DEAL_PIPELINE_STAGES.slice(0, 6).map((s, i) => (
                <span key={s} className="flex items-center gap-4 text-xs">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: DEAL_CHART_PALETTE[i % DEAL_CHART_PALETTE.length] }} />
                  <span className="muted">{s.replace(/_/g, " ")}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="card mb-16" style={{ padding: "10px 14px", background: "var(--amber-bg)", border: "1px solid color-mix(in oklab, var(--amber) 25%, transparent)" }}>
          <p className="muted text-sm" style={{ margin: 0 }}>{t("Read-only view. Contact admin for changes.")}</p>
        </div>
      )}

      {isAdmin && (
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("New deal")}>
          <form onSubmit={createDeal} className="form mb-14">
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Deal title")} *</span>
                <input value={create.title} onChange={(e) => setCreate((s) => ({ ...s, title: e.target.value }))} required />
              </label>
              <label className="field">
                <span className="label">{t("Lead node")} *</span>
                <select value={create.leadNodeId} onChange={(e) => setCreate((s) => ({ ...s, leadNodeId: e.target.value }))} required>
                  <option value="">{t("Select node...")}</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Project")}</span>
                <select value={create.projectId} onChange={(e) => setCreate((s) => ({ ...s, projectId: e.target.value }))}>
                  <option value="">{t("No project")}</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            </div>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Capital profile")}</span>
                <select value={create.capitalId} onChange={(e) => setCreate((s) => ({ ...s, capitalId: e.target.value }))}>
                  <option value="">{t("No capital")}</option>
                  {capitals.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Description")}</span>
                <textarea value={create.description} onChange={(e) => setCreate((s) => ({ ...s, description: e.target.value }))} rows={2} />
              </label>
            </div>
            <div className="flex gap-8 items-center">
              <button type="submit" className="button" disabled={busy || !create.title.trim()}>
                {busy ? t("Creating...") : t("Create")}
              </button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>{t("Cancel")}</button>
            </div>
            {error && <p className="form-error">{error}</p>}
          </form>
        </FormCard>
      )}

      <div className="flex items-center gap-12 flex-wrap">
        <div className="flex items-center gap-8" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              type="search"
              placeholder={t("Search deals...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: "100%" }}
            />
          </div>
          {hasFilters && (
            <button className="button-secondary text-xs" style={{ whiteSpace: "nowrap" }} onClick={() => { setSearch(""); setStageFilter("ALL"); }}>
              <X size={12} /> {t("Clear")}
            </button>
          )}
        </div>
        <div className="flex gap-6">
          <button type="button" className={`chip ${viewMode === "table" ? "chip-active" : ""}`} onClick={() => setViewMode("table")}>
            <Table2 size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> {t("Table")}
          </button>
          <button type="button" className={`chip ${viewMode === "pipeline" ? "chip-active" : ""}`} onClick={() => setViewMode("pipeline")}>
            <LayoutGrid size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> {t("Pipeline")}
          </button>
        </div>
        <span className="muted text-sm">{filtered.length} {t("deals")}</span>
      </div>

      <FilterToolbar<StageFilter>
        filters={STAGES as unknown as readonly StageFilter[]}
        active={stageFilter}
        onChange={setStageFilter}
        counts={stageCounts as any}
        totalLabel={t("All")}
        totalCount={deals.length}
      />

      {loading && (
        <div className="loading-state" style={{ padding: "24px 0" }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && viewMode === "pipeline" ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={<Handshake size={32} />}
            message={hasFilters ? t("No deals match your filters.") : t("No deals yet.")}
          />
        ) : (
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {DEAL_PIPELINE_STAGES.map((stage) => {
              const col = pipelineGroups[stage] ?? [];
              const color = DEAL_STAGE_COLORS[stage] ?? "#94a3b8";
              return (
                <div key={stage} className="card" style={{ padding: 0, minHeight: 200 }}>
                  <div style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span className="font-semibold text-sm">{stage.replace(/_/g, " ")}</span>
                    <span className="muted text-xs" style={{ marginLeft: "auto" }}>{col.length}</span>
                  </div>
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {col.map((d) => (
                      <Link
                        key={d.id}
                        href={`/dashboard/deals/${d.id}`}
                        className="card"
                        style={{ padding: "8px 10px", margin: 0, textDecoration: "none", display: "block" }}
                      >
                        <div className="font-semibold text-sm">{d.title}</div>
                        <div className="muted text-xs">{d.leadNode.name}</div>
                      </Link>
                    ))}
                    {col.length === 0 && (
                      <p className="muted text-xs" style={{ textAlign: "center", padding: 16 }}>{t("Empty")}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : !loading && filtered.length === 0 ? (
        <EmptyState
          icon={<Handshake size={32} />}
          message={hasFilters ? t("No deals match your filters.") : t("No deals yet.")}
        />
      ) : !loading ? (
        <div className="data-table-wrap reveal">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th onClick={() => toggleSort("title")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Deal")} <SortIcon col="title" /></span>
                </th>
                <th onClick={() => toggleSort("leadNode")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Lead Node")} <SortIcon col="leadNode" /></span>
                </th>
                <th onClick={() => toggleSort("stage")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Stage")} <SortIcon col="stage" /></span>
                </th>
                <th className="hide-mobile">{t("Stats")}</th>
                <th onClick={() => toggleSort("updatedAt")} style={{ cursor: "pointer" }} className="hide-mobile">
                  <span className="flex items-center gap-4">{t("Updated")} <SortIcon col="updatedAt" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="data-table-clickable"
                  onClick={() => router.push(`/dashboard/deals/${d.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/dashboard/deals/${d.id}`); }}
                >
                  <td><span className={`status-dot ${stageDotClass(d.stage)}`} /></td>
                  <td>
                    <span className="font-semibold">{d.title}</span>
                    {d.nextAction && <div className="muted text-xs">{t("Next:")} {d.nextAction}</div>}
                  </td>
                  <td>
                    <div className="text-sm">{d.leadNode.name}</div>
                    {d.project && <div className="muted text-xs">{d.project.name}</div>}
                    {d.capital && <div className="muted text-xs">{d.capital.name}</div>}
                  </td>
                  <td><StatusBadge status={d.stage} /></td>
                  <td className="muted text-xs hide-mobile">
                    {d._count.tasks}T · {d._count.milestones}M · {d._count.participants}P
                  </td>
                  <td className="muted text-xs hide-mobile">{relativeTime(d.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {error && !showForm && <p className="form-error">{error}</p>}
    </div>
  );
}
