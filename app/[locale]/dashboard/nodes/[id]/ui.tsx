"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { FolderKanban, ListTodo, Bot, FileStack, TrendingUp, MapPin, BarChart3, Loader2 } from "lucide-react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { formatNodeType } from "@/lib/nodes/node-type-label";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";

type NodeData = {
  id: string;
  name: string;
  type: string;
  status: string;
  level: number;
  region: string | null;
  city: string | null;
  jurisdiction: string | null;
  vertical: string | null;
  territoryJson: unknown | null;
  description: string | null;
  tags: string[];
  entityName: string | null;
  entityType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  resourcesOffered: string | null;
  pastCases: string | null;
  recommendation: string | null;
  allowedServices: string[];
  riskLevel: string | null;
  billingStatus: string | null;
  depositStatus: string | null;
  seatFeeStatus: string | null;
  onboardingScore: number | null;
  owner: { id: string; name: string | null; email: string | null } | null;
  projects: { id: string; name: string; status: string }[];
  tasksAsOwner: { id: string; title: string; status: string }[];
  dealsAsLead: { id: string; title: string; stage: string }[];
  ownedAgents: { id: string; name: string; status: string; type: string }[];
  _count: { pobRecords: number; settlementLines: number };
};

type ScorecardData = {
  id: string;
  period: string;
  totalScore: number;
  dimensions: Array<{ name: string; score: number; weight: number }>;
  actionBadge: "UPGRADE" | "MAINTAIN" | "WATCHLIST" | "DOWNGRADE" | "REMOVE";
  createdAt: string;
};

type TerritoryData = {
  id: string;
  region: string;
  scope: string;
  exclusivity: string;
  protectedAccounts: string[];
  status: string;
  notes?: string;
};

function mapApiScorecardToUi(row: {
  id: string;
  period: string;
  totalScore: number;
  pipelineScore: number;
  closureScore: number;
  evidenceScore: number;
  collaborationScore: number;
  riskScore: number;
  action: string;
  createdAt: string | Date;
}): ScorecardData {
  const createdAt =
    typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString();
  return {
    id: row.id,
    period: row.period,
    totalScore: row.totalScore,
    actionBadge: row.action as ScorecardData["actionBadge"],
    createdAt,
    dimensions: [
      { name: "Pipeline", score: row.pipelineScore, weight: 0.2 },
      { name: "Closure", score: row.closureScore, weight: 0.2 },
      { name: "Evidence", score: row.evidenceScore, weight: 0.2 },
      { name: "Collaboration", score: row.collaborationScore, weight: 0.2 },
      { name: "Risk", score: row.riskScore, weight: 0.2 },
    ],
  };
}

const LIFECYCLE = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEED_MORE_INFO", "APPROVED",
  "CONTRACTING", "LIVE", "WATCHLIST", "PROBATION", "SUSPENDED", "OFFBOARDED", "REJECTED",
];

const COLOR_MAP: Record<string, string> = {
  UPGRADE: "badge-green",
  MAINTAIN: "badge-accent",
  WATCHLIST: "badge-yellow",
  DOWNGRADE: "badge-red",
  REMOVE: "badge-red",
};

const STATUS_DOT_MAP: Record<string, string> = {
  ACTIVE: "status-dot-green",
  APPROVED: "status-dot-green",
  CLOSED: "status-dot-green",
  ACCEPTED: "status-dot-green",
  REJECTED: "status-dot-red",
  CANCELLED: "status-dot-red",
  SUSPENDED: "status-dot-red",
  INACTIVE: "status-dot-amber",
  PENDING: "status-dot-amber",
  UNDER_REVIEW: "status-dot-amber",
};

function getStatusDot(status: string): string {
  return STATUS_DOT_MAP[status] || "status-dot-amber";
}

function TabBar({ activeTab, onChange, tabs }: { activeTab: string; onChange: (key: string) => void; tabs: Array<{ key: string; label: string }> }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--line)", marginBottom: 20 }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === tab.key ? "var(--accent)" : "var(--muted)",
            fontWeight: activeTab === tab.key ? 600 : 400,
            marginBottom: -2,
            fontSize: 14,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function NodeDetail({ node: initialNode, isAdmin }: { node: NodeData; isAdmin: boolean }) {
  const { t } = useAutoTranslate();
  const [node, setNode] = useState(initialNode);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState(node.status);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Scorecard state
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [scorecardHistory, setScorecardHistory] = useState<ScorecardData[]>([]);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [scorecardError, setScorecardError] = useState<string | null>(null);
  const [recalculatePeriod, setRecalculatePeriod] = useState("last_quarter");
  const [recalculateBusy, setRecalculateBusy] = useState(false);

  // Territory state
  const [territories, setTerritories] = useState<TerritoryData[]>([]);
  const [territoriesLoading, setTerritoriesLoading] = useState(false);
  const [territoriesError, setTerritoriesError] = useState<string | null>(null);
  const [showNewTerritoryForm, setShowNewTerritoryForm] = useState(false);
  const [newTerritory, setNewTerritory] = useState({ region: "", scope: "", exclusivity: false, protectedAccounts: "", notes: "" });
  const [newTerritoryBusy, setNewTerritoryBusy] = useState(false);

  async function transition(newStatus: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(newStatus);
        setNotes("");
      } else {
        setError(data.error || t("Transition failed."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function fetchScorecard() {
    setScorecardLoading(true);
    setScorecardError(null);
    try {
      const res = await fetch(`/api/nodes/${node.id}/scorecard`);
      const json = await res.json();
      if (json.ok && json.data) {
        const latest = json.data.latest as Record<string, unknown> | null;
        const historyRaw = json.data.history as Record<string, unknown>[] | undefined;
        setScorecard(latest ? mapApiScorecardToUi(latest as Parameters<typeof mapApiScorecardToUi>[0]) : null);
        setScorecardHistory(
          Array.isArray(historyRaw)
            ? historyRaw.map((row) => mapApiScorecardToUi(row as Parameters<typeof mapApiScorecardToUi>[0]))
            : [],
        );
      } else {
        const msg =
          typeof json.error === "object" && json.error && "message" in json.error
            ? String((json.error as { message?: string }).message)
            : "Failed to load scorecard";
        setScorecardError(msg);
      }
    } catch (err) {
      setScorecardError("Error loading scorecard");
    } finally {
      setScorecardLoading(false);
    }
  }

  async function recalculateScorecard() {
    setRecalculateBusy(true);
    setScorecardError(null);
    try {
      const res = await fetch(`/api/nodes/${node.id}/scorecard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: recalculatePeriod }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchScorecard();
      } else {
        const msg =
          typeof data.error === "object" && data.error && "message" in data.error
            ? String((data.error as { message?: string }).message)
            : "Recalculation failed";
        setScorecardError(msg);
      }
    } catch (err) {
      setScorecardError("Error recalculating scorecard");
    } finally {
      setRecalculateBusy(false);
    }
  }

  async function fetchTerritories() {
    setTerritoriesLoading(true);
    setTerritoriesError(null);
    try {
      const res = await fetch(`/api/nodes/${node.id}/territories`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setTerritories(
          json.data.map((t: { id: string; region: string; scope: string; exclusivity: string; protectedAccounts: string[]; status: string; notes?: string }) => ({
            id: t.id,
            region: t.region,
            scope: t.scope,
            exclusivity: t.exclusivity,
            protectedAccounts: t.protectedAccounts ?? [],
            status: t.status,
            notes: t.notes,
          })),
        );
      } else {
        const msg =
          typeof json.error === "object" && json.error && "message" in json.error
            ? String((json.error as { message?: string }).message)
            : "Failed to load territories";
        setTerritoriesError(msg);
      }
    } catch (err) {
      setTerritoriesError("Error loading territories");
    } finally {
      setTerritoriesLoading(false);
    }
  }

  async function claimTerritory() {
    setNewTerritoryBusy(true);
    setScorecardError(null);
    try {
      const exclusivity = newTerritory.exclusivity ? ("EXCLUSIVE" as const) : ("NONE" as const);
      const res = await fetch(`/api/nodes/${node.id}/territories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: newTerritory.region.trim(),
          scope: newTerritory.scope.trim(),
          exclusivity,
          ...(exclusivity === "EXCLUSIVE" ? { kpiTarget: {} } : {}),
          protectedAccounts: newTerritory.protectedAccounts.split(",").map((s) => s.trim()).filter(Boolean),
          notes: newTerritory.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewTerritory({ region: "", scope: "", exclusivity: false, protectedAccounts: "", notes: "" });
        setShowNewTerritoryForm(false);
        await fetchTerritories();
      } else {
        setScorecardError(data.error || "Failed to claim territory");
      }
    } catch (err) {
      setScorecardError("Error claiming territory");
    } finally {
      setNewTerritoryBusy(false);
    }
  }

  useEffect(() => {
    if (activeTab === "scorecard" && !scorecard && !scorecardLoading) {
      fetchScorecard();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "territory" && territories.length === 0 && !territoriesLoading) {
      fetchTerritories();
    }
  }, [activeTab]);

  const subtitleParts = [
    formatNodeType(node.type, t),
    `L${node.level}`,
    [node.region, node.city].filter(Boolean).join(" · ") || null,
    node.vertical || null,
  ].filter(Boolean) as string[];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "scorecard", label: "Scorecard" },
    { key: "territory", label: "Territory" },
    { key: "pipeline", label: "Pipeline" },
    { key: "pob", label: "PoB & Evidence" },
  ];

  return (
    <DetailLayout
      backHref="/dashboard/nodes"
      backLabel={t("All Nodes")}
      title={node.name}
      subtitle={subtitleParts.length ? subtitleParts.join(" · ") : undefined}
      badge={<StatusBadge status={status} />}
      meta={
        <span className="flex flex-wrap items-center gap-10">
          {node.owner ? (
            <span>
              {t("Owner:")}{" "}
              <span className="font-medium">{node.owner.name || node.owner.email || "—"}</span>
            </span>
          ) : null}
          {node.riskLevel ? <span className="badge badge-red text-xs">{node.riskLevel}</span> : null}
        </span>
      }
    >
      <TabBar activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {activeTab === "overview" && (
        <div>
          <div className="grid-2 gap-16">
            <div className="card p-18">
              <h3 className="mt-0 mb-12">{t("Profile")}</h3>
              <div className="flex-col gap-8 text-base">
                {node.region && <div><span className="muted">{t("Region:")}</span> {node.region}</div>}
                {node.city && <div><span className="muted">{t("City:")}</span> {node.city}</div>}
                {node.jurisdiction && <div><span className="muted">{t("Jurisdiction:")}</span> {node.jurisdiction}</div>}
                {node.vertical && <div><span className="muted">{t("Vertical:")}</span> {node.vertical}</div>}
                {node.territoryJson != null && typeof node.territoryJson === "object" && (
                  <div>
                    <span className="muted">{t("Territory:")}</span>
                    <pre className="mt-4 mb-0 p-8 text-xs font-mono overflow-auto" style={{ maxHeight: 160, background: "var(--bg-elev)" }}>
                      {JSON.stringify(node.territoryJson, null, 2)}
                    </pre>
                  </div>
                )}
                {node.entityName && <div><span className="muted">{t("Entity:")}</span> {node.entityName} {node.entityType ? `(${node.entityType})` : ""}</div>}
                {node.contactName && <div><span className="muted">{t("Contact:")}</span> {node.contactName}</div>}
                {node.contactEmail && <div><span className="muted">{t("Email:")}</span> {node.contactEmail}</div>}
                {node.resourcesOffered && <div><span className="muted">{t("Resources:")}</span> {node.resourcesOffered}</div>}
                {node.pastCases && <div><span className="muted">{t("Past cases:")}</span> {node.pastCases}</div>}
                {node.recommendation && <div><span className="muted">{t("Recommendation:")}</span> {node.recommendation}</div>}
                {node.description && <div className="mt-8"><span className="muted">{t("Description:")}</span><p className="mt-4 mb-0">{node.description}</p></div>}
              </div>
              {node.tags.length > 0 && (
                <div className="flex flex-wrap gap-6 mt-12">
                  {node.tags.map((tag) => (
                    <span key={tag} className="badge text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {node.allowedServices.length > 0 && (
                <div className="flex flex-wrap gap-6 items-center mt-8">
                  <span className="muted text-xs">{t("Services:")}</span>
                  {node.allowedServices.map((s) => (
                    <span key={s} className="badge badge-accent text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-col gap-16">
              <div className="grid-2 gap-16">
                <StatCard label={t("Projects")} value={node.projects.length} icon={<FolderKanban size={16} />} />
                <StatCard label={t("Tasks")} value={node.tasksAsOwner.length} icon={<ListTodo size={16} />} />
                <StatCard label={t("Deals")} value={node.dealsAsLead.length} icon={<TrendingUp size={16} />} />
                <StatCard label={t("PoB records")} value={node._count.pobRecords} icon={<FileStack size={16} />} />
                <StatCard label={t("Settlement lines")} value={node._count.settlementLines} icon={<BarChart3 size={16} />} />
                <StatCard label={t("Agents")} value={node.ownedAgents.length} icon={<Bot size={16} />} />
              </div>
              {isAdmin && (
                <div className="card p-18">
                  <h3 className="mt-0 mb-12">{t("Billing")}</h3>
                  <div className="flex-col gap-6 text-sm">
                    <div><span className="muted">{t("Billing:")}</span> {node.billingStatus ?? "—"}</div>
                    <div><span className="muted">{t("Deposit:")}</span> {node.depositStatus ?? "—"}</div>
                    <div><span className="muted">{t("Seat fee:")}</span> {node.seatFeeStatus ?? "—"}</div>
                    {node.onboardingScore != null && <div><span className="muted">{t("Onboarding score:")}</span> {node.onboardingScore}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="card p-18 mt-16">
              <h3 className="mt-0 mb-12">{t("Lifecycle Actions")}</h3>
              <input
                placeholder={t("Notes (optional)")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mb-8"
                style={{ maxWidth: 400 }}
              />
              <div className="flex flex-wrap gap-8">
                {LIFECYCLE.map((s) => (
                  <button key={s} className="button-secondary text-xs" disabled={busy || s === status} onClick={() => transition(s)}>
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              {error && <p className="form-error mt-8">{error}</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === "scorecard" && (
        <div>
          {scorecardLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span className="muted">{t("Loading scorecard...")}</span>
            </div>
          ) : scorecardError ? (
            <div className="card p-18" style={{ borderLeft: "4px solid var(--red)" }}>
              <p className="form-error mt-0">{scorecardError}</p>
            </div>
          ) : scorecard ? (
            <div className="flex-col gap-16">
              <div className="grid-2 gap-16">
                <div className="card p-18">
                  <h3 className="mt-0 mb-12">{t("Latest Scorecard")}</h3>
                  <div className="flex-col gap-12">
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>{scorecard.totalScore.toFixed(1)}</div>
                    <div className="muted text-sm">{t("Period:")} {scorecard.period}</div>
                    <span className={`badge ${COLOR_MAP[scorecard.actionBadge] || "badge-accent"} text-sm font-semibold`}>{scorecard.actionBadge}</span>
                    <div className="flex-col gap-8 mt-8">
                      {scorecard.dimensions.map((dim) => (
                        <div key={dim.name} className="flex-col gap-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{dim.name}</span>
                            <span className="muted">{dim.score.toFixed(1)}</span>
                          </div>
                          <div className="progress-bar" style={{ height: 8, background: "var(--bg-elev)" }}>
                            <div className="progress-bar-fill" style={{ width: `${(dim.score / 100) * 100}%`, height: 8 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="muted text-xs mt-4">{t("Generated:")} {new Date(scorecard.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex-col gap-12">
                  {isAdmin && (
                    <div className="card p-18">
                      <h3 className="mt-0 mb-12">{t("Recalculate")}</h3>
                      <div className="flex-col gap-8">
                        <select
                          value={recalculatePeriod}
                          onChange={(e) => setRecalculatePeriod(e.target.value)}
                          style={{ maxWidth: 200 }}
                        >
                          <option value="last_month">{t("Last Month")}</option>
                          <option value="last_quarter">{t("Last Quarter")}</option>
                          <option value="last_year">{t("Last Year")}</option>
                          <option value="all_time">{t("All Time")}</option>
                        </select>
                        <button
                          className="button"
                          disabled={recalculateBusy}
                          onClick={recalculateScorecard}
                          style={{ maxWidth: 200 }}
                        >
                          {recalculateBusy ? `${t("Calculating")}...` : t("Recalculate")}
                        </button>
                        {scorecardError && <p className="form-error mt-0 mb-0">{scorecardError}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {scorecardHistory.length > 0 && (
                <div className="card p-18">
                  <h3 className="mt-0 mb-12">{t("History")}</h3>
                  <table className="data-table w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <th style={{ textAlign: "left", padding: "8px 0", fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{t("Period")}</th>
                        <th style={{ textAlign: "left", padding: "8px 0", fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{t("Score")}</th>
                        <th style={{ textAlign: "left", padding: "8px 0", fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{t("Action")}</th>
                        <th style={{ textAlign: "left", padding: "8px 0", fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{t("Date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scorecardHistory.map((sc) => (
                        <tr key={sc.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "8px 0", fontSize: 14 }}>{sc.period}</td>
                          <td style={{ padding: "8px 0", fontSize: 14, fontWeight: 600 }}>{sc.totalScore.toFixed(1)}</td>
                          <td style={{ padding: "8px 0" }}>
                            <span className={`badge ${COLOR_MAP[sc.actionBadge] || "badge-accent"} text-xs`}>{sc.actionBadge}</span>
                          </td>
                          <td style={{ padding: "8px 0", fontSize: 12, color: "var(--muted)" }}>{new Date(sc.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-18">
              <p className="muted mt-0">{t("No scorecard available yet.")}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "territory" && (
        <div>
          {territoriesLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span className="muted">{t("Loading territories...")}</span>
            </div>
          ) : territoriesError ? (
            <div className="card p-18" style={{ borderLeft: "4px solid var(--red)" }}>
              <p className="form-error mt-0">{territoriesError}</p>
            </div>
          ) : (
            <div className="flex-col gap-16">
              {isAdmin && (
                <div className="card p-18">
                  <button
                    className="button"
                    onClick={() => setShowNewTerritoryForm(!showNewTerritoryForm)}
                  >
                    {showNewTerritoryForm ? t("Cancel") : t("Claim Territory")}
                  </button>
                  {showNewTerritoryForm && (
                    <div className="flex-col gap-12 mt-16">
                      <input
                        placeholder={t("Region")}
                        value={newTerritory.region}
                        onChange={(e) => setNewTerritory({ ...newTerritory, region: e.target.value })}
                        className="w-full"
                        style={{ maxWidth: 400 }}
                      />
                      <input
                        placeholder={t("Scope")}
                        value={newTerritory.scope}
                        onChange={(e) => setNewTerritory({ ...newTerritory, scope: e.target.value })}
                        className="w-full"
                        style={{ maxWidth: 400 }}
                      />
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={newTerritory.exclusivity}
                          onChange={(e) => setNewTerritory({ ...newTerritory, exclusivity: e.target.checked })}
                        />
                        <span>{t("Exclusive Territory")}</span>
                      </label>
                      <textarea
                        placeholder={t("Protected Accounts (comma-separated)")}
                        value={newTerritory.protectedAccounts}
                        onChange={(e) => setNewTerritory({ ...newTerritory, protectedAccounts: e.target.value })}
                        className="w-full"
                        style={{ maxWidth: 400, minHeight: 80 }}
                      />
                      <textarea
                        placeholder={t("Notes")}
                        value={newTerritory.notes}
                        onChange={(e) => setNewTerritory({ ...newTerritory, notes: e.target.value })}
                        className="w-full"
                        style={{ maxWidth: 400, minHeight: 80 }}
                      />
                      <button
                        className="button"
                        disabled={newTerritoryBusy || !newTerritory.region || !newTerritory.scope}
                        onClick={claimTerritory}
                        style={{ maxWidth: 200 }}
                      >
                        {newTerritoryBusy ? `${t("Claiming")}...` : t("Claim")}
                      </button>
                      {scorecardError && <p className="form-error mt-0 mb-0">{scorecardError}</p>}
                    </div>
                  )}
                </div>
              )}

              {territories.length > 0 ? (
                <div className="grid-2 gap-16">
                  {territories.map((terr) => (
                    <div key={terr.id} className="card p-18">
                      <div className="flex items-start justify-between mb-12">
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{terr.region}</h4>
                          <div className="muted text-sm mt-2">{terr.scope}</div>
                        </div>
                        <span className={`badge ${getStatusDot(terr.status).replace("status-dot-", "badge-")} text-xs`}>{terr.status}</span>
                      </div>
                      <div className="flex-col gap-6 text-sm mb-12">
                        {terr.exclusivity !== "NONE" && (
                          <div>
                            <span className="muted">{t("Exclusive:")}</span> {terr.exclusivity}
                          </div>
                        )}
                        {terr.protectedAccounts.length > 0 && (
                          <div>
                            <span className="muted">{t("Protected accounts:")}</span>
                            <div className="flex flex-wrap gap-4 mt-4">
                              {terr.protectedAccounts.map((acc) => (
                                <span key={acc} className="badge badge-accent text-xs">
                                  {acc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {terr.notes && <div><span className="muted">{t("Notes:")}</span><p className="mt-2 mb-0">{terr.notes}</p></div>}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-8">
                          <button className="button-secondary text-xs">{t("Edit")}</button>
                          <button className="button-secondary text-xs" style={{ color: "var(--red)" }}>{t("Revoke")}</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-18">
                  <p className="muted mt-0">{t("No territories claimed yet.")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "pipeline" && (
        <div>
          <div className="flex-col gap-16">
            {node.projects.length > 0 && (
              <div className="card p-18">
                <h3 className="mt-0 mb-12">{t("Projects")}</h3>
                <div className="flex-col gap-8">
                  {node.projects.map((p) => (
                    <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="flex items-center gap-8 text-base">
                      <span className={`status-dot ${getStatusDot(p.status)}`} />
                      <span className="font-semibold">{p.name}</span>
                      <StatusBadge status={p.status} className="text-xs" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {node.dealsAsLead.length > 0 && (
              <div className="card p-18">
                <h3 className="mt-0 mb-12">{t("Deals")}</h3>
                <div className="flex-col gap-8">
                  {node.dealsAsLead.map((d) => (
                    <Link key={d.id} href={`/dashboard/deals/${d.id}`} className="flex items-center gap-8 text-base">
                      <span className={`status-dot ${getStatusDot(d.stage)}`} />
                      <span className="font-semibold">{d.title}</span>
                      <StatusBadge status={d.stage} className="text-xs" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {node.tasksAsOwner.length > 0 && (
              <div className="card p-18">
                <h3 className="mt-0 mb-12">{t("Tasks")}</h3>
                <div className="flex-col gap-8">
                  {node.tasksAsOwner.map((task) => (
                    <div key={task.id} className="flex items-center gap-8 text-base">
                      <span className={`status-dot ${getStatusDot(task.status)}`} />
                      <span className="font-semibold">{task.title}</span>
                      <StatusBadge status={task.status} className="text-xs" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.projects.length === 0 && node.dealsAsLead.length === 0 && node.tasksAsOwner.length === 0 && (
              <div className="card p-18">
                <p className="muted mt-0">{t("No projects, deals, or tasks yet.")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "pob" && (
        <div>
          <div className="flex-col gap-16">
            <div className="grid-2 gap-16">
              <StatCard label={t("PoB Records")} value={node._count.pobRecords} icon={<FileStack size={16} />} />
              <StatCard label={t("Settlement Lines")} value={node._count.settlementLines} icon={<BarChart3 size={16} />} />
            </div>
            <div className="card p-18">
              <h3 className="mt-0 mb-12">{t("Proof of Business")}</h3>
              {node._count.pobRecords > 0 ? (
                <Link href={`/dashboard/pob?node=${node.id}`} className="button">
                  {t("View PoB Records")}
                </Link>
              ) : (
                <p className="muted mt-0">{t("No PoB records available.")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
