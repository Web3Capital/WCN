"use client";

import { Fragment, useMemo, useState, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { Search, ChevronDown, ChevronUp, X, RefreshCw, TrendingUp, Target, Handshake, Clock, LayoutGrid, Table2 } from "lucide-react";
import { StatusBadge, FilterToolbar, EmptyState, StatCard, ConfirmDialog, DashboardDistributionPie, DashboardPipelineBar } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type MatchRow = {
  id: string;
  projectId: string;
  capitalProfileId: string;
  capitalNodeId: string;
  score: number;
  sectorScore: number;
  stageScore: number;
  ticketScore: number;
  jurisdictionScore: number;
  status: string;
  interestAt: string | null;
  declinedAt: string | null;
  convertedDealId: string | null;
  expiresAt: string | null;
  createdAt: string;
  project: { id: string; name: string; sector: string | null; stage: string; status: string };
  capitalProfile: {
    id: string; name: string; status: string; investmentFocus: string[];
    ticketMin: number | null; ticketMax: number | null;
  };
};

const STATUSES = ["ALL", "GENERATED", "INTEREST_EXPRESSED", "CONVERTED_TO_DEAL", "DECLINED", "EXPIRED"] as const;
type StatusFilter = (typeof STATUSES)[number];

type SortKey = "project" | "capital" | "score" | "status" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const MATCH_PIPELINE_ORDER = ["GENERATED", "INTEREST_EXPRESSED", "CONVERTED_TO_DEAL", "DECLINED", "EXPIRED"] as const;
const MATCH_STATUS_COLORS: Record<string, string> = {
  GENERATED: "#94a3b8",
  INTEREST_EXPRESSED: "#6366f1",
  CONVERTED_TO_DEAL: "#22c55e",
  DECLINED: "#ef4444",
  EXPIRED: "#6b7280",
};
const MATCH_CHART_PALETTE = ["#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"] as const;

function statusDotClass(status: string): string {
  if (status === "CONVERTED_TO_DEAL") return "status-dot-green";
  if (status === "INTEREST_EXPRESSED") return "status-dot-accent";
  if (status === "DECLINED" || status === "EXPIRED") return "status-dot-red";
  return "status-dot-amber";
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

function sortValue(m: MatchRow, key: SortKey): string | number {
  switch (key) {
    case "project": return m.project.name.toLowerCase();
    case "capital": return m.capitalProfile.name.toLowerCase();
    case "score": return m.score;
    case "status": return m.status;
    case "createdAt": return m.createdAt;
  }
}

export function MatchesConsole({
  initialMatches,
  isAdmin,
}: {
  initialMatches: MatchRow[];
  isAdmin: boolean;
}) {
  const { t } = useAutoTranslate();
  const [matches, setMatches] = useState(initialMatches);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [convertModalId, setConvertModalId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");

  // --- Derived stats ---
  const stats = useMemo(() => {
    const total = matches.length;
    const avgScore = total > 0 ? matches.reduce((s, m) => s + m.score, 0) / total : 0;
    const converted = matches.filter((m) => m.status === "CONVERTED_TO_DEAL").length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    const pendingInterest = matches.filter((m) => m.status === "INTEREST_EXPRESSED").length;
    return { total, avgScore, conversionRate, pendingInterest };
  }, [matches]);

  // --- Status counts for filter chips ---
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of matches) c[m.status] = (c[m.status] || 0) + 1;
    return c;
  }, [matches]);

  // --- Filtering + sorting ---
  const filtered = useMemo(() => {
    let list = matches;
    if (filter !== "ALL") list = list.filter((m) => m.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.project.name.toLowerCase().includes(q) ||
        m.capitalProfile.name.toLowerCase().includes(q) ||
        (m.project.sector ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [matches, filter, search, sortKey, sortDir]);

  const pipelineGroups = useMemo(() => {
    const g: Record<string, MatchRow[]> = {};
    for (const s of MATCH_PIPELINE_ORDER) g[s] = filtered.filter((m) => m.status === s);
    return g;
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  const hasFilters = filter !== "ALL" || search.trim();

  // --- Sorting ---
  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "score" ? "desc" : "asc"); }
  }, [sortKey]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  // --- Actions ---
  const performAction = useCallback(async (matchId: string, action: "interest" | "decline" | "convert", dealId?: string) => {
    setBusy(matchId);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, dealId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, ...data.data, project: m.project, capitalProfile: m.capitalProfile } : m))
        );
      } else {
        setError(data.error?.message || data.error || t("Action failed."));
      }
    } catch {
      setError(t("Network error."));
    }
    setBusy(null);
  }, [t]);

  const handleRegenerate = useCallback(async (projectId: string) => {
    setRegenerating(projectId);
    setError(null);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message || data.error || t("Regeneration failed."));
      }
    } catch {
      setError(t("Network error."));
    }
    setRegenerating(null);
  }, [t]);

  const handleConvert = useCallback((dealId?: string) => {
    if (convertModalId && dealId) {
      performAction(convertModalId, "convert", dealId);
    }
    setConvertModalId(null);
  }, [convertModalId, performAction]);

  // --- Score bar ---
  const scoreBar = useCallback((label: string, value: number) => {
    const pct = Math.round(value * 100);
    return (
      <div className="flex items-center gap-8" style={{ fontSize: 12 }}>
        <span className="font-semibold" style={{ width: 80 }}>{label}</span>
        <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 0.3s" }} />
        </div>
        <span className="muted text-right" style={{ width: 36 }}>{pct}%</span>
      </div>
    );
  }, []);

  const colCount = isAdmin ? 8 : 7;

  return (
    <div className="flex-col gap-16">
      {/* Stat cards */}
      <div className="grid-4 gap-12">
        <StatCard label={t("Total Matches")} value={stats.total} icon={<Target size={18} />} />
        <StatCard label={t("Avg Score")} value={stats.avgScore.toFixed(1)} sub={t("out of 100")} icon={<TrendingUp size={18} />} />
        <StatCard label={t("Conversion Rate")} value={`${stats.conversionRate.toFixed(1)}%`} icon={<Handshake size={18} />} />
        <StatCard label={t("Pending Interest")} value={stats.pendingInterest} icon={<Clock size={18} />} />
      </div>

      {isAdmin && Object.keys(statusCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status distribution")}</h3>
            <DashboardDistributionPie data={statusCounts as Record<string, number>} colorMap={MATCH_STATUS_COLORS} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={MATCH_PIPELINE_ORDER} data={statusCounts as Record<string, number>} palette={MATCH_CHART_PALETTE} />
            <div className="flex gap-6 flex-wrap mt-12">
              {MATCH_PIPELINE_ORDER.map((s, i) => (
                <span key={s} className="flex items-center gap-4 text-xs">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: MATCH_CHART_PALETTE[i % MATCH_CHART_PALETTE.length] }} />
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

      {/* Search + view + clear */}
      <div className="flex items-center gap-12 flex-wrap">
        <div className="flex items-center gap-8" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input
              type="search"
              placeholder={t("Search matches...")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: 32, width: "100%" }}
            />
          </div>
          {hasFilters && (
            <button className="button-secondary text-xs" style={{ whiteSpace: "nowrap" }} onClick={() => { setSearch(""); setFilter("ALL"); setPage(0); }}>
              <X size={12} /> {t("Clear")}
            </button>
          )}
        </div>
        <div className="flex gap-6">
          <button type="button" className={`chip ${viewMode === "table" ? "chip-active" : ""}`} onClick={() => { setViewMode("table"); setPage(0); }}>
            <Table2 size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> {t("Table")}
          </button>
          <button type="button" className={`chip ${viewMode === "pipeline" ? "chip-active" : ""}`} onClick={() => setViewMode("pipeline")}>
            <LayoutGrid size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> {t("Pipeline")}
          </button>
        </div>
        <span className="muted text-sm">{filtered.length} {t("matches")}</span>
      </div>

      {/* Filter toolbar with counts */}
      <FilterToolbar<StatusFilter>
        filters={STATUSES as unknown as readonly StatusFilter[]}
        active={filter}
        onChange={(v) => { setFilter(v); setPage(0); }}
        counts={statusCounts as Partial<Record<StatusFilter, number>>}
        totalLabel={t("All")}
        totalCount={matches.length}
      />

      {error && <p className="form-error">{error}</p>}

      {viewMode === "pipeline" ? (
        filtered.length === 0 ? (
          <EmptyState message={hasFilters ? t("No matches match your filters.") : t("No matches found.")} />
        ) : (
          <div
            className="reveal"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}
          >
            {MATCH_PIPELINE_ORDER.map((stage) => {
              const col = pipelineGroups[stage] ?? [];
              const color = MATCH_STATUS_COLORS[stage] ?? "#94a3b8";
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
                    {col.map((m) => (
                      <Link
                        key={m.id}
                        href={`/dashboard/projects/${m.project.id}`}
                        className="card"
                        style={{ padding: "8px 10px", margin: 0, textDecoration: "none", display: "block" }}
                      >
                        <div className="font-semibold text-sm">{m.project.name}</div>
                        <div className="muted text-xs">{m.capitalProfile.name} · {m.score}</div>
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
      ) : paged.length === 0 ? (
        <EmptyState message={hasFilters ? t("No matches match your filters.") : t("No matches found.")} />
      ) : (
        <div className="data-table-wrap reveal">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th onClick={() => toggleSort("project")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Project")} <SortIcon col="project" /></span>
                </th>
                <th onClick={() => toggleSort("capital")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Capital Profile")} <SortIcon col="capital" /></span>
                </th>
                <th onClick={() => toggleSort("score")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Score")} <SortIcon col="score" /></span>
                </th>
                <th onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-4">{t("Status")} <SortIcon col="status" /></span>
                </th>
                <th onClick={() => toggleSort("createdAt")} style={{ cursor: "pointer" }} className="hide-mobile">
                  <span className="flex items-center gap-4">{t("Created")} <SortIcon col="createdAt" /></span>
                </th>
                {isAdmin && <th className="hide-mobile">{t("Capital Node")}</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {paged.map((m) => (
                <Fragment key={m.id}>
                  <tr
                    className="data-table-clickable"
                    onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  >
                    <td>
                      <span className={`status-dot ${statusDotClass(m.status)}`} />
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/projects/${m.project.id}`}
                        className="font-bold text-sm"
                        style={{ color: "var(--accent)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {m.project.name}
                      </Link>
                      <div className="muted text-xs">
                        {m.project.sector ?? "—"} · {m.project.stage}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-semibold">{m.capitalProfile.name}</div>
                      <div className="muted text-xs">
                        {m.capitalProfile.investmentFocus.slice(0, 3).join(", ") || "—"}
                      </div>
                    </td>
                    <td>
                      <button
                        className="badge badge-accent font-bold text-sm"
                        style={{ cursor: "pointer", border: "none", background: "var(--accent-alpha)" }}
                        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === m.id ? null : m.id); }}
                        title={t("Click to see score breakdown")}
                      >
                        {m.score.toFixed(1)}
                      </button>
                    </td>
                    <td>
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="muted text-xs hide-mobile">{relativeTime(m.createdAt)}</td>
                    {isAdmin && (
                      <td className="muted text-xs hide-mobile">{m.capitalNodeId.slice(0, 8)}…</td>
                    )}
                    <td>
                      <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                        {m.status === "GENERATED" && (
                          <>
                            <button
                              className="button"
                              style={{ fontSize: 10, padding: "3px 8px" }}
                              disabled={busy === m.id}
                              onClick={() => performAction(m.id, "interest")}
                            >
                              {t("Interest")}
                            </button>
                            <button
                              className="button-secondary"
                              style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }}
                              disabled={busy === m.id}
                              onClick={() => performAction(m.id, "decline")}
                            >
                              {t("Decline")}
                            </button>
                          </>
                        )}
                        {m.status === "INTEREST_EXPRESSED" && (
                          <>
                            <button
                              className="button"
                              style={{ fontSize: 10, padding: "3px 8px" }}
                              disabled={busy === m.id}
                              onClick={() => setConvertModalId(m.id)}
                            >
                              {t("Convert")}
                            </button>
                            <button
                              className="button-secondary"
                              style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }}
                              disabled={busy === m.id}
                              onClick={() => performAction(m.id, "decline")}
                            >
                              {t("Decline")}
                            </button>
                          </>
                        )}
                        {m.convertedDealId && (
                          <Link href={`/dashboard/deals/${m.convertedDealId}`} style={{ fontSize: 11, color: "var(--accent)" }}>
                            {t("View deal")}
                          </Link>
                        )}
                        {isAdmin && m.status === "GENERATED" && (
                          <button
                            className="button-secondary"
                            style={{ fontSize: 10, padding: "3px 8px" }}
                            disabled={regenerating === m.projectId}
                            onClick={() => handleRegenerate(m.projectId)}
                            title={t("Regenerate matches for this project")}
                          >
                            <RefreshCw size={10} className={regenerating === m.projectId ? "spin" : ""} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === m.id && (
                    <tr>
                      <td />
                      <td colSpan={colCount - 1}>
                        <div className="card p-14" style={{ margin: "4px 0 8px" }}>
                          <div style={{ display: "grid", gap: 6 }}>
                            {scoreBar(t("Sector"), m.sectorScore)}
                            {scoreBar(t("Stage"), m.stageScore)}
                            {scoreBar(t("Ticket"), m.ticketScore)}
                            {scoreBar(t("Jurisdiction"), m.jurisdictionScore)}
                          </div>
                          <div className="muted text-xs mt-8">
                            {t("Composite:")} {m.score.toFixed(2)} / 100
                            {m.expiresAt && <> · {t("Expires:")} {new Date(m.expiresAt).toLocaleDateString()}</>}
                            {m.capitalProfile.ticketMin != null && m.capitalProfile.ticketMax != null && (
                              <> · {t("Ticket range:")} ${(m.capitalProfile.ticketMin / 1_000_000).toFixed(1)}M – ${(m.capitalProfile.ticketMax / 1_000_000).toFixed(1)}M</>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (table only) */}
      {viewMode === "table" && totalPages > 1 && (
        <div className="flex items-center gap-12" style={{ justifyContent: "space-between" }}>
          <span className="muted text-xs">
            {t("Showing")} {rangeStart}–{rangeEnd} {t("of")} {filtered.length}
          </span>
          <div className="flex-center gap-8">
            <button
              className="button-secondary"
              style={{ fontSize: 11, padding: "4px 12px" }}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              ← {t("Prev")}
            </button>
            <span className="muted" style={{ fontSize: 12, lineHeight: "28px" }}>
              {page + 1} / {totalPages}
            </span>
            <button
              className="button-secondary"
              style={{ fontSize: 11, padding: "4px 12px" }}
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              {t("Next")} →
            </button>
          </div>
        </div>
      )}

      {/* Convert to Deal dialog */}
      <ConfirmDialog
        open={!!convertModalId}
        title={t("Convert to Deal")}
        description={t("Enter the Deal ID to link this match.")}
        confirmLabel={t("Convert")}
        cancelLabel={t("Cancel")}
        withInput
        inputLabel={t("Deal ID")}
        inputPlaceholder={t("Deal ID")}
        onConfirm={handleConvert}
        onCancel={() => setConvertModalId(null)}
      />
    </div>
  );
}
