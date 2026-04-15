"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { Network, Radio, Clock, AlertCircle } from "lucide-react";
import {
  StatusBadge,
  FormCard,
  EmptyState,
  StatCard,
  FilterToolbar,
  DashboardDistributionPie,
  DashboardPipelineBar,
} from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

export type NodesConsoleInitialMeta = {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  statusCounts: Record<string, number>;
};

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
const NODE_STATUS = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEED_MORE_INFO",
  "APPROVED",
  "REJECTED",
  "CONTRACTING",
  "LIVE",
  "PROBATION",
  "SUSPENDED",
  "OFFBOARDED",
  "ACTIVE",
] as const;

const ALL_NODE_FILTERS = ["ALL", ...NODE_STATUS] as const;

const NODE_PIPELINE_COLUMNS = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEED_MORE_INFO",
  "APPROVED",
  "CONTRACTING",
  "LIVE",
  "ACTIVE",
  "PROBATION",
  "SUSPENDED",
  "REJECTED",
  "OFFBOARDED",
] as const;

const NODE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SUBMITTED: "#f59e0b",
  UNDER_REVIEW: "#a855f7",
  NEED_MORE_INFO: "#f97316",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  CONTRACTING: "#6366f1",
  LIVE: "#22c55e",
  ACTIVE: "#16a34a",
  PROBATION: "#f97316",
  SUSPENDED: "#ef4444",
  OFFBOARDED: "#6b7280",
};

const NODE_PIPELINE_BAR_ORDER = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "CONTRACTING",
  "LIVE",
  "ACTIVE",
  "PROBATION",
  "SUSPENDED",
  "OFFBOARDED",
] as const;

const NODE_PIPELINE_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#f97316",
  "#94a3b8",
] as const;

export function NodesConsole({
  initial,
  readOnly = false,
  initialMeta,
}: {
  initial: NodeRow[];
  readOnly?: boolean;
  initialMeta?: NodesConsoleInitialMeta;
}) {
  const { t } = useAutoTranslate();
  const [rows, setRows] = useState<NodeRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [create, setCreate] = useState({
    name: "",
    type: "CITY",
    status: "SUBMITTED",
    tags: "",
    region: "",
    city: "",
    jurisdiction: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [statusFilter, setStatusFilter] = useState<(typeof ALL_NODE_FILTERS)[number]>("ALL");
  const [typeFilter, setTypeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [nextCursor, setNextCursor] = useState<string | null>(initialMeta?.nextCursor ?? null);
  const [hasMoreList, setHasMoreList] = useState(initialMeta?.hasMore ?? false);
  const [catalogCounts, setCatalogCounts] = useState<Record<string, number>>(initialMeta?.statusCounts ?? {});

  const listLimit = initialMeta?.limit ?? 100;

  const loadNodes = useCallback(
    async (mode: "replace" | "append", cursorForAppend: string | null = null) => {
      setLoadingList(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(listLimit));
        params.set("includeCounts", "1");
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (typeFilter) params.set("type", typeFilter);
        if (regionFilter.trim()) params.set("region", regionFilter.trim());
        if (mode === "append" && cursorForAppend) params.set("cursor", cursorForAppend);

        const res = await fetch(`/api/nodes?${params}`, { cache: "no-store" });
        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error ?? t("Failed to load nodes."));

        const payload = data.data as {
          nodes?: NodeRow[];
          meta?: { nextCursor?: string | null; hasMore?: boolean; limit?: number };
          statusCounts?: Record<string, number>;
        };
        const list = Array.isArray(payload?.nodes) ? payload.nodes : [];
        if (payload?.statusCounts) setCatalogCounts(payload.statusCounts);
        const meta = payload?.meta;
        setNextCursor(meta?.nextCursor ?? null);
        setHasMoreList(meta?.hasMore ?? false);

        if (mode === "append") {
          setRows((prev) => {
            const ids = new Set(prev.map((r) => r.id));
            return [...prev, ...list.filter((r) => !ids.has(r.id))];
          });
        } else {
          setRows(list);
          setSelectedId((sid) => {
            if (sid && list.some((r) => r.id === sid)) return sid;
            return list[0]?.id ?? null;
          });
        }
      } catch (e: any) {
        setError(e?.message ?? t("Failed to load nodes."));
      } finally {
        setLoadingList(false);
      }
    },
    [listLimit, regionFilter, statusFilter, typeFilter, t],
  );

  const skipFilterEffect = useRef(true);
  useEffect(() => {
    if (skipFilterEffect.current) {
      skipFilterEffect.current = false;
      return;
    }
    void loadNodes("replace");
  }, [statusFilter, typeFilter, loadNodes]);

  async function onCreate() {
    setError(null);
    setCreating(true);
    try {
      const tags = create.tags
        .split(",")
        .map((s) => s.trim())
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
          jurisdiction: create.jurisdiction || null,
        }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Create failed."));
      await loadNodes("replace");
      setCreate({ name: "", type: "CITY", status: "SUBMITTED", tags: "", region: "", city: "", jurisdiction: "" });
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? t("Create failed."));
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
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Save failed."));
      await loadNodes("replace");
    } catch (e: any) {
      setError(e?.message ?? t("Save failed."));
    } finally {
      setSaving(false);
    }
  }

  const nodeKpis = useMemo(() => {
    const keys = Object.keys(catalogCounts);
    if (keys.length > 0) {
      const total = keys.reduce((s, k) => s + (catalogCounts[k] ?? 0), 0);
      const live = (catalogCounts.LIVE ?? 0) + (catalogCounts.ACTIVE ?? 0);
      const inReview =
        (catalogCounts.SUBMITTED ?? 0) + (catalogCounts.UNDER_REVIEW ?? 0) + (catalogCounts.NEED_MORE_INFO ?? 0);
      const suspended = (catalogCounts.SUSPENDED ?? 0) + (catalogCounts.OFFBOARDED ?? 0);
      return {
        mode: "catalog" as const,
        total,
        live,
        inReview,
        suspended,
        pageCount: rows.length,
      };
    }
    const live = rows.filter((r) => r.status === "LIVE" || r.status === "ACTIVE").length;
    const inReview = rows.filter((r) => ["SUBMITTED", "UNDER_REVIEW", "NEED_MORE_INFO"].includes(r.status)).length;
    const suspended = rows.filter((r) => r.status === "SUSPENDED" || r.status === "OFFBOARDED").length;
    return { mode: "page" as const, total: rows.length, live, inReview, suspended, pageCount: rows.length };
  }, [catalogCounts, rows]);

  const totalCardSub =
    nodeKpis.mode === "catalog" && nodeKpis.pageCount !== nodeKpis.total
      ? t("{{n}} on this page").replace("{{n}}", String(nodeKpis.pageCount))
      : undefined;

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.region ?? "").toLowerCase().includes(q) ||
        (r.city ?? "").toLowerCase().includes(q) ||
        (r.jurisdiction ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const pipelineGroups = useMemo(() => {
    const groups: Record<string, NodeRow[]> = {};
    for (const s of NODE_PIPELINE_COLUMNS) {
      groups[s] = filteredRows.filter((r) => r.status === s);
    }
    return groups;
  }, [filteredRows]);

  const toolbarCounts = catalogCounts as Partial<Record<(typeof ALL_NODE_FILTERS)[number], number>>;

  return (
    <div className="mt-16">
      <div className="grid-4 mb-16">
        <StatCard label={t("Total nodes")} value={nodeKpis.total} sub={totalCardSub} icon={<Network size={18} />} />
        <StatCard
          label={t("Live")}
          value={nodeKpis.live}
          sub={t("LIVE + ACTIVE")}
          icon={<Radio size={18} />}
        />
        <StatCard
          label={t("In review")}
          value={nodeKpis.inReview}
          sub={t("Submitted / review / info")}
          icon={<Clock size={18} />}
        />
        <StatCard label={t("Suspended / offboarded")} value={nodeKpis.suspended} icon={<AlertCircle size={18} />} />
      </div>

      {readOnly ? (
        <div
          className="card mb-16"
          style={{
            padding: "10px 14px",
            background: "var(--amber-bg)",
            border: "1px solid color-mix(in oklab, var(--amber) 25%, transparent)",
          }}
        >
          <p className="muted text-sm" style={{ margin: 0 }}>
            {t("Read-only view. Contact admin for changes.")}{" "}
            {t("You are viewing only nodes you own.")}
          </p>
        </div>
      ) : null}

      {!readOnly && Object.keys(catalogCounts).length > 0 ? (
        <div className="grid-2 mb-16 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status Distribution")}</h3>
            <DashboardDistributionPie data={catalogCounts} colorMap={NODE_STATUS_COLORS} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline Flow")}</h3>
            <DashboardPipelineBar
              orderedKeys={NODE_PIPELINE_BAR_ORDER}
              data={catalogCounts}
              palette={NODE_PIPELINE_PALETTE}
            />
            <div className="flex gap-6 flex-wrap mt-12">
              {NODE_PIPELINE_BAR_ORDER.map((s, i) => (
                <span key={s} className="flex items-center gap-4 text-xs">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: NODE_PIPELINE_PALETTE[i % NODE_PIPELINE_PALETTE.length],
                    }}
                  />
                  <span className="muted">{s.replace(/_/g, " ")}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!readOnly ? (
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Create node")}>
          <div className="form mb-14">
            <label className="field">
              <span className="label">{t("Name")}</span>
              <input value={create.name} onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))} />
            </label>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Type")}</span>
                <select value={create.type} onChange={(e) => setCreate((s) => ({ ...s, type: e.target.value }))}>
                  {NODE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Status")}</span>
                <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                  {NODE_STATUS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">{t("Tags (comma separated)")}</span>
              <input value={create.tags} onChange={(e) => setCreate((s) => ({ ...s, tags: e.target.value }))} />
            </label>
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Region")}</span>
                <input value={create.region} onChange={(e) => setCreate((s) => ({ ...s, region: e.target.value }))} />
              </label>
              <label className="field">
                <span className="label">{t("City")}</span>
                <input value={create.city} onChange={(e) => setCreate((s) => ({ ...s, city: e.target.value }))} />
              </label>
              <label className="field">
                <span className="label">{t("Jurisdiction")}</span>
                <input
                  value={create.jurisdiction}
                  onChange={(e) => setCreate((s) => ({ ...s, jurisdiction: e.target.value }))}
                />
              </label>
            </div>
            <button className="button" type="button" disabled={creating || !create.name.trim()} onClick={onCreate}>
              {creating ? t("Creating...") : t("Create")}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        </FormCard>
      ) : null}

      <div className="flex items-center gap-12 mb-12 flex-wrap">
        <input
          className="input"
          placeholder={t("Search nodes...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <div style={{ flex: 1 }} />
        <div className="flex gap-6">
          <button
            type="button"
            className={`chip ${viewMode === "list" ? "chip-active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            {t("List")}
          </button>
          <button
            type="button"
            className={`chip ${viewMode === "pipeline" ? "chip-active" : ""}`}
            onClick={() => setViewMode("pipeline")}
          >
            {t("Pipeline")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-12 mb-12">
        <label className="field" style={{ minWidth: 160 }}>
          <span className="label">{t("Type")}</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">{t("All")}</option>
            {NODE_TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ minWidth: 140, flex: "1 1 200px" }}>
          <span className="label">{t("Region")}</span>
          <input value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} placeholder={t("Filter…")} />
        </label>
        <button className="button-secondary" type="button" disabled={loadingList} onClick={() => loadNodes("replace")}>
          {loadingList ? t("Loading...") : t("Apply filters")}
        </button>
      </div>

      <FilterToolbar
        filters={ALL_NODE_FILTERS}
        active={statusFilter}
        onChange={setStatusFilter}
        counts={toolbarCounts}
        totalLabel={t("All")}
        totalCount={nodeKpis.total}
      />

      {viewMode === "list" ? (
        <div className="apps-layout mt-16">
          <div>
            <div className="pill mb-10">
              {t("Nodes")} ({filteredRows.length}
              {filteredRows.length !== rows.length ? ` / ${rows.length}` : ""}){hasMoreList ? ` · ${t("more available")}` : ""}
            </div>
            <div className="apps-list">
              {filteredRows.map((r) => {
                const active = r.id === selectedId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="apps-row flex items-center gap-12"
                    data-active={active ? "true" : "false"}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <span
                      className={`status-dot ${
                        r.status === "LIVE" || r.status === "APPROVED" || r.status === "ACTIVE"
                          ? "status-dot-green"
                          : r.status === "SUSPENDED" || r.status === "REJECTED" || r.status === "OFFBOARDED"
                            ? "status-dot-red"
                            : r.status === "SUBMITTED" ||
                                r.status === "UNDER_REVIEW" ||
                                r.status === "CONTRACTING" ||
                                r.status === "PROBATION"
                              ? "status-dot-amber"
                              : ""
                      }`}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={`/dashboard/nodes/${r.id}`}
                        className="font-bold"
                        style={{ color: "var(--accent)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.name}
                      </Link>
                      <div className="muted text-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.type} · L{r.level}
                        {r.region ? ` · ${r.region}` : ""}
                        {r.city ? ` · ${r.city}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                    <span className="muted text-xs" style={{ flexShrink: 0 }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })}
            </div>
            {filteredRows.length === 0 ? (
              <EmptyState message={search ? t("No matching nodes.") : t("No nodes in this view.")} />
            ) : null}
            {hasMoreList && nextCursor ? (
              <button
                className="button-secondary mt-12"
                type="button"
                disabled={loadingList}
                onClick={() => loadNodes("append", nextCursor)}
              >
                {loadingList ? t("Loading...") : t("Load more")}
              </button>
            ) : null}
          </div>

          <div>
            <div className="pill mb-10">{t("Details")}</div>
            {selected ? (
              <div className="form">
                <label className="field">
                  <span className="label">{t("Name")}</span>
                  <input
                    key={selected.id + selected.name}
                    defaultValue={selected.name}
                    readOnly={readOnly}
                    disabled={readOnly}
                    onBlur={readOnly ? undefined : (e) => onSave({ name: e.target.value })}
                  />
                </label>
                <div className="grid-2 gap-12">
                  <label className="field">
                    <span className="label">{t("Type")}</span>
                    <select
                      key={selected.id + "t"}
                      defaultValue={selected.type}
                      disabled={readOnly}
                      onChange={readOnly ? undefined : (e) => onSave({ type: e.target.value })}
                    >
                      {NODE_TYPES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="label">{t("Status")}</span>
                    <select
                      key={selected.id + "s"}
                      defaultValue={selected.status}
                      disabled={readOnly}
                      onChange={readOnly ? undefined : (e) => onSave({ status: e.target.value })}
                    >
                      {NODE_STATUS.map((v) => (
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
                <div className="grid-3 gap-12">
                  <label className="field">
                    <span className="label">{t("Region")}</span>
                    <input
                      key={selected.id + "r"}
                      defaultValue={selected.region ?? ""}
                      readOnly={readOnly}
                      disabled={readOnly}
                      onBlur={readOnly ? undefined : (e) => onSave({ region: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span className="label">{t("City")}</span>
                    <input
                      key={selected.id + "c"}
                      defaultValue={selected.city ?? ""}
                      readOnly={readOnly}
                      disabled={readOnly}
                      onBlur={readOnly ? undefined : (e) => onSave({ city: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span className="label">{t("Jurisdiction")}</span>
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
                  <span className="label">{t("Level")}</span>
                  <input
                    key={selected.id + "l"}
                    type="number"
                    defaultValue={selected.level}
                    readOnly={readOnly}
                    disabled={readOnly}
                    onBlur={readOnly ? undefined : (e) => onSave({ level: Number(e.target.value) })}
                  />
                </label>
                <button className="button-secondary" type="button" disabled={loadingList} onClick={() => loadNodes("replace")}>
                  {loadingList ? t("Loading...") : t("Refresh")}
                </button>
                {error ? <p className="form-error">{error}</p> : null}
              </div>
            ) : (
              <EmptyState message={t("Select a node.")} />
            )}
          </div>
        </div>
      ) : (
        <div
          className="capital-pipeline mt-16"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}
        >
          {NODE_PIPELINE_COLUMNS.map((stage) => {
            const stageNodes = pipelineGroups[stage] ?? [];
            const color = NODE_STATUS_COLORS[stage] ?? "#94a3b8";
            return (
              <div key={stage} className="card" style={{ padding: 0, minHeight: 200 }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span className="font-semibold text-sm">{stage.replace(/_/g, " ")}</span>
                  <span className="muted text-xs" style={{ marginLeft: "auto" }}>
                    {stageNodes.length}
                  </span>
                </div>
                <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {stageNodes.map((r) => (
                    <Link
                      key={r.id}
                      href={`/dashboard/nodes/${r.id}`}
                      className="card"
                      style={{ padding: "8px 10px", margin: 0, textDecoration: "none", display: "block" }}
                    >
                      <div className="font-semibold text-sm">{r.name}</div>
                      <div className="muted text-xs">
                        {r.type} · L{r.level}
                        {r.region ? ` · ${r.region}` : ""}
                      </div>
                    </Link>
                  ))}
                  {stageNodes.length === 0 ? (
                    <p className="muted text-xs" style={{ textAlign: "center", padding: 16 }}>
                      {t("Empty")}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
