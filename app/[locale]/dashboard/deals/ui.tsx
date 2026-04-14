"use client";

import { useMemo, useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Search, ChevronDown, ChevronUp, X, Handshake } from "lucide-react";
import { StatusBadge, FormCard, EmptyState, FilterToolbar } from "../_components";
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

export function DealsConsole({
  initialDeals,
  nodes,
  projects,
  capitals,
  isAdmin,
}: {
  initialDeals: DealRow[];
  nodes: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  capitals: { id: string; name: string }[];
  isAdmin: boolean;
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

      {!loading && filtered.length === 0 ? (
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
