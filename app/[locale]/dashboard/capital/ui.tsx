"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { StatusBadge, EmptyState, FormCard, FilterToolbar, StatCard } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { Landmark, TrendingUp, Users, DollarSign } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

type CapitalRow = {
  id: string;
  name: string;
  status: string;
  entity: string | null;
  investorType: string | null;
  aum: string | null;
  investmentFocus: string[];
  instruments: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  totalDeployed: number;
  totalDeals: number;
  contactName: string | null;
  node: { id: string; name: string } | null;
  createdAt: string;
};

type CapitalStats = {
  total: number;
  active: number;
  totalDeployed: number;
  avgTicket: number;
  statusCounts: Record<string, number>;
};

const ALL_STATUSES = ["ALL", "PROSPECT", "QUALIFIED", "ACTIVE", "WARM", "IN_DD", "CLOSED", "PASSED", "DORMANT"] as const;

const INVESTOR_TYPES = [
  { value: "VC", label: "VC" },
  { value: "FAMILY_OFFICE", label: "Family Office" },
  { value: "CVC", label: "CVC" },
  { value: "ANGEL", label: "Angel" },
  { value: "HNW", label: "HNW" },
  { value: "LP", label: "LP" },
  { value: "DAO_TREASURY", label: "DAO Treasury" },
  { value: "OTHER", label: "Other" },
];

const FOCUS_OPTIONS = ["DeFi", "AI", "RWA", "Infrastructure", "Gaming", "L1/L2", "Security", "Social", "DAO", "NFT", "Payments"];
const INSTRUMENT_OPTIONS = ["SAFE", "SAFT", "Token Warrant", "Equity", "Convertible Note", "OTC", "Secondary"];
const REGION_OPTIONS = ["APAC", "Middle East", "EU", "North America", "LATAM", "Africa"];
const STRUCTURE_OPTIONS = ["SEED", "PRE_A", "SERIES_A", "STRATEGIC", "OTC", "SECONDARY", "GROWTH"];

const STATUS_COLORS: Record<string, string> = {
  PROSPECT: "#94a3b8", QUALIFIED: "#f59e0b", ACTIVE: "#22c55e", WARM: "#f97316",
  IN_DD: "#a855f7", CLOSED: "#22c55e", PASSED: "#ef4444", DORMANT: "#6b7280",
};

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#22c55e", "#f59e0b", "#ef4444", "#f97316", "#94a3b8"];

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function MultiSelect({ options, value, onChange, placeholder }: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const { t } = useAutoTranslate();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="input"
        onClick={() => setOpen(!open)}
        style={{ textAlign: "left", cursor: "pointer", minHeight: 38 }}
      >
        {value.length === 0
          ? <span className="muted">{t(placeholder)}</span>
          : <span>{value.join(", ")}</span>}
      </button>
      {open && (
        <div className="card" style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          maxHeight: 200, overflow: "auto", padding: 8, marginTop: 4,
        }}>
          {options.map((o) => (
            <label key={o} className="flex items-center gap-6" style={{ padding: "4px 6px", cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={value.includes(o)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...value, o]);
                  else onChange(value.filter((v) => v !== o));
                }}
              />
              {o}
            </label>
          ))}
          <button type="button" className="text-xs muted mt-4" onClick={() => setOpen(false)} style={{ width: "100%", textAlign: "center" }}>
            {t("Done")}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusDistributionChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([label, count]) => ({ label, count })).filter((d) => d.count > 0);
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-16">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie data={items} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={50} innerRadius={24}>
            {items.map((item) => (
              <Cell key={item.label} fill={STATUS_COLORS[item.label] ?? "#6366f1"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-6 text-xs">
            <span style={{
              width: 8, height: 8, borderRadius: 2, flexShrink: 0,
              background: STATUS_COLORS[item.label] ?? "#6366f1",
            }} />
            <span className="muted">{item.label.replace(/_/g, " ")}</span>
            <span className="font-semibold" style={{ marginLeft: "auto" }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineBar({ data }: { data: Record<string, number> }) {
  const stages = ["PROSPECT", "QUALIFIED", "WARM", "ACTIVE", "IN_DD", "CLOSED"];
  const items = stages.map((s) => ({ stage: s.replace(/_/g, " "), count: data[s] ?? 0 }));
  const total = items.reduce((a, b) => a + b.count, 0);
  if (total === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={44}>
      <BarChart data={items} layout="vertical" barGap={0} barSize={28}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="stage" hide />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 4, 4]}>
          {items.map((item, i) => (
            <Cell key={item.stage} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CapitalConsole({ initialProfiles, nodes, isAdmin, stats }: {
  initialProfiles: CapitalRow[];
  nodes: { id: string; name: string }[];
  isAdmin: boolean;
  stats: CapitalStats;
}) {
  const { t } = useAutoTranslate();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [statusFilter, setStatusFilter] = useState<typeof ALL_STATUSES[number]>("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");

  // Form state
  const [name, setName] = useState("");
  const [entity, setEntity] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [aum, setAum] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [ticketMin, setTicketMin] = useState("");
  const [ticketMax, setTicketMax] = useState("");
  const [maxConcurrentDeals, setMaxConcurrentDeals] = useState("");
  const [decisionTimeline, setDecisionTimeline] = useState("");
  const [investmentFocus, setInvestmentFocus] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [jurisdictionLimit, setJurisdictionLimit] = useState<string[]>([]);
  const [structurePref, setStructurePref] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    let list = profiles;
    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.entity ?? "").toLowerCase().includes(q) ||
          (p.investorType ?? "").toLowerCase().includes(q) ||
          (p.node?.name ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [profiles, statusFilter, search]);

  const pipelineGroups = useMemo(() => {
    const groups: Record<string, CapitalRow[]> = {};
    for (const s of ["PROSPECT", "QUALIFIED", "WARM", "ACTIVE", "IN_DD", "CLOSED", "PASSED", "DORMANT"]) {
      groups[s] = filtered.filter((p) => p.status === s);
    }
    return groups;
  }, [filtered]);

  function resetForm() {
    setName(""); setEntity(""); setInvestorType(""); setAum("");
    setNodeId(""); setTicketMin(""); setTicketMax("");
    setMaxConcurrentDeals(""); setDecisionTimeline("");
    setInvestmentFocus([]); setInstruments([]);
    setJurisdictionLimit([]); setStructurePref([]);
    setContactName(""); setContactEmail("");
  }

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/capital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          entity: entity || null,
          investorType: investorType || null,
          aum: aum || null,
          nodeId: nodeId || null,
          ticketMin: ticketMin ? Number(ticketMin) : null,
          ticketMax: ticketMax ? Number(ticketMax) : null,
          maxConcurrentDeals: maxConcurrentDeals ? Number(maxConcurrentDeals) : null,
          decisionTimeline: decisionTimeline || null,
          investmentFocus,
          instruments,
          jurisdictionLimit,
          structurePref,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfiles([{ ...data.data, node: nodes.find((n) => n.id === nodeId) ?? null }, ...profiles]);
        setShowForm(false);
        resetForm();
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-16">
      {/* KPI Summary */}
      <div className="grid-4 mb-16">
        <StatCard
          label={t("Total Profiles")}
          value={stats.total}
          icon={<Users size={18} />}
        />
        <StatCard
          label={t("Active Pipeline")}
          value={stats.active}
          sub={t("In ACTIVE / WARM / IN_DD")}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label={t("Total Deployed")}
          value={stats.totalDeployed > 0 ? fmt(stats.totalDeployed) : "—"}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label={t("Avg Ticket Size")}
          value={stats.avgTicket > 0 ? fmt(stats.avgTicket) : "—"}
          icon={<Landmark size={18} />}
        />
      </div>

      {/* Distribution Charts */}
      {isAdmin && Object.keys(stats.statusCounts).length > 0 && (
        <div className="grid-2 mb-16 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status Distribution")}</h3>
            <StatusDistributionChart data={stats.statusCounts} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline Flow")}</h3>
            <PipelineBar data={stats.statusCounts} />
            <div className="flex gap-6 flex-wrap mt-12">
              {["PROSPECT", "QUALIFIED", "WARM", "ACTIVE", "IN_DD", "CLOSED"].map((s, i) => (
                <span key={s} className="flex items-center gap-4 text-xs">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i] }} />
                  <span className="muted">{s.replace(/_/g, " ")}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Form (Admin) */}
      {isAdmin && (
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Add capital profile")}>
          <form onSubmit={createProfile} className="form">
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Name")} *</span>
                <input placeholder={t("Investor / Fund name")} value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="field">
                <span className="label">{t("Entity")}</span>
                <input placeholder={t("Legal entity")} value={entity} onChange={(e) => setEntity(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">{t("Investor Type")}</span>
                <select value={investorType} onChange={(e) => setInvestorType(e.target.value)}>
                  <option value="">{t("Select type...")}</option>
                  {INVESTOR_TYPES.map((it) => <option key={it.value} value={it.value}>{it.label}</option>)}
                </select>
              </label>
            </div>

            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("AUM")}</span>
                <input placeholder={t("e.g. $50M–$100M")} value={aum} onChange={(e) => setAum(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">{t("Min Ticket")}</span>
                <input type="number" placeholder="0" value={ticketMin} onChange={(e) => setTicketMin(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">{t("Max Ticket")}</span>
                <input type="number" placeholder="0" value={ticketMax} onChange={(e) => setTicketMax(e.target.value)} />
              </label>
            </div>

            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Linked Node")}</span>
                <select value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
                  <option value="">{t("No linked node")}</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Max Concurrent Deals")}</span>
                <input type="number" placeholder={t("e.g. 5")} value={maxConcurrentDeals} onChange={(e) => setMaxConcurrentDeals(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">{t("Decision Timeline")}</span>
                <input placeholder={t("e.g. 2–4 weeks")} value={decisionTimeline} onChange={(e) => setDecisionTimeline(e.target.value)} />
              </label>
            </div>

            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Investment Focus")}</span>
                <MultiSelect options={FOCUS_OPTIONS} value={investmentFocus} onChange={setInvestmentFocus} placeholder="Select sectors..." />
              </label>
              <label className="field">
                <span className="label">{t("Instruments")}</span>
                <MultiSelect options={INSTRUMENT_OPTIONS} value={instruments} onChange={setInstruments} placeholder="Select instruments..." />
              </label>
            </div>

            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Target Regions")}</span>
                <MultiSelect options={REGION_OPTIONS} value={jurisdictionLimit} onChange={setJurisdictionLimit} placeholder="Select regions..." />
              </label>
              <label className="field">
                <span className="label">{t("Stage Preferences")}</span>
                <MultiSelect options={STRUCTURE_OPTIONS} value={structurePref} onChange={setStructurePref} placeholder="Select stages..." />
              </label>
            </div>

            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Contact Name")}</span>
                <input placeholder={t("Primary contact")} value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">{t("Contact Email")}</span>
                <input type="email" placeholder={t("Email")} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </label>
            </div>

            <div className="flex gap-8">
              <button type="submit" className="button" disabled={busy}>{busy ? t("Creating...") : t("Create Profile")}</button>
              <button type="button" className="button-secondary" onClick={() => { setShowForm(false); resetForm(); }}>{t("Cancel")}</button>
            </div>
          </form>
        </FormCard>
      )}

      {!isAdmin && (
        <div className="card mb-16" style={{ padding: "10px 14px", background: "var(--amber-bg)", border: "1px solid color-mix(in oklab, var(--amber) 25%, transparent)" }}>
          <p className="muted text-sm" style={{ margin: 0 }}>{t("Read-only view. Contact admin for changes.")}</p>
        </div>
      )}

      {/* Toolbar: search + filter + view toggle */}
      <div className="flex items-center gap-12 mb-12 flex-wrap">
        <input
          className="input"
          placeholder={t("Search profiles...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <div style={{ flex: 1 }} />
        <div className="flex gap-6">
          <button
            className={`chip ${viewMode === "list" ? "chip-active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            {t("List")}
          </button>
          <button
            className={`chip ${viewMode === "pipeline" ? "chip-active" : ""}`}
            onClick={() => setViewMode("pipeline")}
          >
            {t("Pipeline")}
          </button>
        </div>
      </div>

      <FilterToolbar
        filters={ALL_STATUSES}
        active={statusFilter}
        onChange={setStatusFilter}
        counts={stats.statusCounts as Record<typeof ALL_STATUSES[number], number>}
        totalLabel={t("All")}
        totalCount={stats.total}
      />

      {/* List View */}
      {viewMode === "list" && (
        <div className="apps-list">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/capital/${p.id}`}
              className="apps-row flex items-center gap-12"
            >
              <span className={`status-dot ${p.status === "ACTIVE" || p.status === "CLOSED" ? "status-dot-green" : p.status === "PASSED" || p.status === "DORMANT" ? "status-dot-red" : p.status === "IN_DD" ? "status-dot-purple" : "status-dot-amber"}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-bold">{p.name}</div>
                <div className="muted text-sm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.investorType ? p.investorType.replace(/_/g, " ") : p.entity ?? "—"}
                  {p.node ? ` · ${p.node.name}` : ""}
                  {(p.ticketMin != null || p.ticketMax != null) ? ` · ${fmt(p.ticketMin ?? 0)}–${fmt(p.ticketMax ?? 0)}` : ""}
                </div>
              </div>
              {p.investmentFocus.length > 0 && (
                <div className="flex gap-4" style={{ flexShrink: 0 }}>
                  {p.investmentFocus.slice(0, 2).map((f) => (
                    <span key={f} className="badge text-xs">{f}</span>
                  ))}
                  {p.investmentFocus.length > 2 && (
                    <span className="badge text-xs muted">+{p.investmentFocus.length - 2}</span>
                  )}
                </div>
              )}
              {p.totalDeployed > 0 && (
                <span className="text-xs font-semibold" style={{ color: "var(--green)", flexShrink: 0 }}>
                  {fmt(p.totalDeployed)}
                </span>
              )}
              <StatusBadge status={p.status} />
              <span className="muted text-xs" style={{ flexShrink: 0 }}>{new Date(p.createdAt).toLocaleDateString()}</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <EmptyState message={search ? t("No matching profiles.") : t("No capital profiles yet.")} />
          )}
        </div>
      )}

      {/* Pipeline View */}
      {viewMode === "pipeline" && (
        <div className="capital-pipeline" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 8 }}>
          {(["PROSPECT", "QUALIFIED", "WARM", "ACTIVE", "IN_DD", "CLOSED", "PASSED", "DORMANT"] as const).map((stage) => {
            const stageProfiles = pipelineGroups[stage] ?? [];
            const color = STATUS_COLORS[stage] ?? "#94a3b8";
            return (
              <div key={stage} className="card" style={{ padding: 0, minHeight: 200 }}>
                <div style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--line)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span className="font-semibold text-sm">{stage.replace(/_/g, " ")}</span>
                  <span className="muted text-xs" style={{ marginLeft: "auto" }}>{stageProfiles.length}</span>
                </div>
                <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {stageProfiles.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/capital/${p.id}`}
                      className="card"
                      style={{ padding: "8px 10px", margin: 0, textDecoration: "none", display: "block" }}
                    >
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="muted text-xs">
                        {p.investorType?.replace(/_/g, " ") ?? p.entity ?? "—"}
                        {(p.ticketMin != null || p.ticketMax != null) ? ` · ${fmt(p.ticketMin ?? 0)}–${fmt(p.ticketMax ?? 0)}` : ""}
                      </div>
                      {p.investmentFocus.length > 0 && (
                        <div className="flex gap-3 mt-4 flex-wrap">
                          {p.investmentFocus.slice(0, 2).map((f) => (
                            <span key={f} className="badge text-xs" style={{ fontSize: 10 }}>{f}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                  {stageProfiles.length === 0 && (
                    <p className="muted text-xs" style={{ textAlign: "center", padding: 16 }}>{t("Empty")}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
