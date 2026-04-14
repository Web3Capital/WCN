"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie,
} from "recharts";
import { TrendingUp, Target, Handshake, DollarSign, Clock, Layers } from "lucide-react";

type MatchRow = {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  project: { id: string; name: string; sector: string | null } | null;
};

type DealRow = {
  id: string;
  title: string;
  stage: string;
  createdAt: string;
  closedAt: string | null;
};

type CapitalData = {
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
  jurisdictionLimit: string[];
  structurePref: string[];
  blacklist: string[];
  restrictions: string | null;
  maxConcurrentDeals: number | null;
  activeDealCount: number;
  decisionTimeline: string | null;
  totalDeployed: number;
  totalDeals: number;
  avgTicketSize: number | null;
  responseSpeed: number | null;
  activityScore: number | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  node: { id: string; name: string } | null;
  deals: DealRow[];
  matches: MatchRow[];
};

type Analytics = {
  dealStageDistribution: Record<string, number>;
  matchScoreDistribution: Record<string, number>;
  totalMatches: number;
  avgMatchScore: number;
};

const STATUSES = ["PROSPECT", "QUALIFIED", "ACTIVE", "WARM", "IN_DD", "CLOSED", "PASSED", "DORMANT"];

const STATUS_COLORS: Record<string, string> = {
  PROSPECT: "#94a3b8", QUALIFIED: "#f59e0b", ACTIVE: "#22c55e", WARM: "#f97316",
  IN_DD: "#a855f7", CLOSED: "#22c55e", PASSED: "#ef4444", DORMANT: "#6b7280",
};

const DEAL_COLORS: Record<string, string> = {
  SOURCED: "#94a3b8", MATCHED: "#f59e0b", INTRO_SENT: "#f59e0b", MEETING_DONE: "#a855f7",
  DD: "#a855f7", TERM_SHEET: "#a855f7", SIGNED: "#22c55e", FUNDED: "#22c55e",
  PASSED: "#ef4444", PAUSED: "#94a3b8",
};

const SCORE_COLORS: Record<string, string> = {
  "80-100": "#22c55e", "60-79": "#6366f1", "40-59": "#f59e0b", "0-39": "#ef4444",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function StatusPipeline({ currentStatus }: { currentStatus: string }) {
  const { t } = useAutoTranslate();
  const pipeline = ["PROSPECT", "QUALIFIED", "WARM", "ACTIVE", "IN_DD", "CLOSED"];
  const terminalStatuses = ["PASSED", "DORMANT"];
  const isTerminal = terminalStatuses.includes(currentStatus);
  const activeIdx = pipeline.indexOf(currentStatus);

  return (
    <div className="card p-18 mb-16">
      <h3 className="mt-0 mb-12">{t("Pipeline Stage")}</h3>
      <div className="flex gap-4 items-center flex-wrap">
        {pipeline.map((s, i) => {
          const isActive = s === currentStatus;
          const isPast = !isTerminal && activeIdx >= 0 && i < activeIdx;
          const color = STATUS_COLORS[s] ?? "#94a3b8";
          return (
            <div key={s} className="flex items-center gap-4">
              <div style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? color : isPast ? `color-mix(in oklab, ${color} 20%, transparent)` : "var(--bg-elev)",
                color: isActive ? "#fff" : isPast ? color : "var(--muted)",
                border: `1px solid ${isActive ? color : "var(--line)"}`,
                transition: "all var(--dur-2) var(--ease-out)",
              }}>
                {s.replace(/_/g, " ")}
              </div>
              {i < pipeline.length - 1 && (
                <span style={{ color: isPast || isActive ? color : "var(--line)", fontSize: 14 }}>→</span>
              )}
            </div>
          );
        })}
      </div>
      {isTerminal && (
        <div className="mt-8">
          <span className="badge" style={{
            background: STATUS_COLORS[currentStatus],
            color: "#fff",
            fontSize: 12,
          }}>
            {currentStatus.replace(/_/g, " ")}
          </span>
        </div>
      )}
    </div>
  );
}

function DealStageChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([stage, count]) => ({ stage: stage.replace(/_/g, " "), count }));
  if (items.length === 0) return <p className="muted text-sm">No deals yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={items}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {items.map((item) => (
            <Cell key={item.stage} fill={DEAL_COLORS[item.stage.replace(/ /g, "_")] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MatchScoreChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([label, count]) => ({ label, count }));
  if (items.length === 0) return <p className="muted text-sm">No matches yet.</p>;

  return (
    <div className="flex items-center gap-16">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie data={items} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={50} innerRadius={24}>
            {items.map((item) => (
              <Cell key={item.label} fill={SCORE_COLORS[item.label] ?? "#6366f1"} />
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
              background: SCORE_COLORS[item.label] ?? "#6366f1",
            }} />
            <span className="muted">{item.label}</span>
            <span className="font-semibold" style={{ marginLeft: "auto" }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapitalDetail({ profile, isAdmin, analytics }: {
  profile: CapitalData;
  isAdmin: boolean;
  analytics: Analytics;
}) {
  const { t } = useAutoTranslate();
  const [status, setStatus] = useState(profile.status);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "deals" | "matches">("overview");

  async function updateStatus(s: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/capital/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      const data = await res.json();
      if (data.ok) setStatus(s);
    } finally { setBusy(false); }
  }

  return (
    <DetailLayout
      backHref="/dashboard/capital"
      backLabel={t("All Capital")}
      title={profile.name}
      subtitle={[
        profile.investorType?.replace(/_/g, " "),
        profile.entity,
      ].filter(Boolean).join(" · ") || undefined}
      badge={<StatusBadge status={status} />}
      meta={profile.node ? (
        <span>{t("Node:")} <Link href={`/dashboard/nodes/${profile.node.id}`} style={{ color: "var(--accent)" }}>{profile.node.name}</Link></span>
      ) : undefined}
    >
      {/* Pipeline visualization */}
      <StatusPipeline currentStatus={status} />

      {/* KPI Row */}
      <div className="grid-4 mb-16">
        <StatCard
          label={t("Total Deployed")}
          value={profile.totalDeployed > 0 ? fmt(profile.totalDeployed) : "—"}
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label={t("Total Deals")}
          value={profile.totalDeals}
          sub={profile.activeDealCount > 0 ? `${profile.activeDealCount} active` : undefined}
          icon={<Handshake size={16} />}
        />
        <StatCard
          label={t("Avg Match Score")}
          value={analytics.avgMatchScore > 0 ? `${analytics.avgMatchScore}/100` : "—"}
          sub={`${analytics.totalMatches} matches`}
          icon={<Target size={16} />}
        />
        <StatCard
          label={t("Avg Ticket")}
          value={profile.avgTicketSize ? fmt(profile.avgTicketSize) : "—"}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-6 mb-16">
        {(["overview", "deals", "matches"] as const).map((tab) => (
          <button
            key={tab}
            className={`chip ${activeTab === tab ? "chip-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(tab === "overview" ? "Overview" : tab === "deals" ? `Deals (${profile.deals.length})` : `Matches (${profile.matches.length})`)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="grid-2 gap-16">
            {/* Investment Profile Card */}
            <div className="card p-18">
              <h3 className="mt-0 mb-12">{t("Investment Profile")}</h3>
              <div className="flex-col gap-10 text-base">
                {profile.investorType && (
                  <div><span className="muted">{t("Type:")}</span> <span className="font-semibold">{profile.investorType.replace(/_/g, " ")}</span></div>
                )}
                {profile.aum && (
                  <div><span className="muted">{t("AUM:")}</span> {profile.aum}</div>
                )}
                {(profile.ticketMin != null || profile.ticketMax != null) && (
                  <div><span className="muted">{t("Ticket range:")}</span> {fmt(profile.ticketMin ?? 0)} – {fmt(profile.ticketMax ?? 0)}</div>
                )}
                {profile.investmentFocus.length > 0 && (
                  <div>
                    <span className="muted">{t("Focus:")}</span>
                    <div className="flex flex-wrap gap-6 mt-4">
                      {profile.investmentFocus.map((f) => <span key={f} className="badge text-xs">{f}</span>)}
                    </div>
                  </div>
                )}
                {profile.instruments.length > 0 && (
                  <div>
                    <span className="muted">{t("Instruments:")}</span>
                    <div className="flex flex-wrap gap-6 mt-4">
                      {profile.instruments.map((i) => <span key={i} className="badge badge-purple text-xs">{i}</span>)}
                    </div>
                  </div>
                )}
                {profile.structurePref.length > 0 && (
                  <div><span className="muted">{t("Stage Pref:")}</span> <span style={{ marginLeft: 6 }}>{profile.structurePref.join(", ")}</span></div>
                )}
                {profile.jurisdictionLimit.length > 0 && (
                  <div><span className="muted">{t("Regions:")}</span> <span style={{ marginLeft: 6 }}>{profile.jurisdictionLimit.join(", ")}</span></div>
                )}
                {profile.restrictions && (
                  <div><span className="muted">{t("Restrictions:")}</span> {profile.restrictions}</div>
                )}
              </div>
            </div>

            {/* Operational Profile Card */}
            <div className="card p-18">
              <h3 className="mt-0 mb-12">{t("Operational Profile")}</h3>
              <div className="flex-col gap-10 text-base">
                {profile.maxConcurrentDeals != null && (
                  <div className="flex items-center gap-8">
                    <Layers size={14} className="muted" />
                    <span className="muted">{t("Max Concurrent Deals:")}</span>
                    <span className="font-semibold">{profile.maxConcurrentDeals}</span>
                    {profile.activeDealCount > 0 && (
                      <span className="badge badge-accent text-xs">{profile.activeDealCount} {t("active")}</span>
                    )}
                  </div>
                )}
                {profile.decisionTimeline && (
                  <div className="flex items-center gap-8">
                    <Clock size={14} className="muted" />
                    <span className="muted">{t("Decision Timeline:")}</span>
                    <span>{profile.decisionTimeline}</span>
                  </div>
                )}
                {profile.responseSpeed != null && (
                  <div><span className="muted">{t("Response Speed:")}</span> {profile.responseSpeed} {t("days")}</div>
                )}
                {profile.activityScore != null && (
                  <div>
                    <span className="muted">{t("Activity Score:")}</span>
                    <span className="font-semibold" style={{ marginLeft: 6 }}>{profile.activityScore}</span>
                    <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "var(--bg-elev)", overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, profile.activityScore)}%`,
                        height: "100%",
                        borderRadius: 2,
                        background: profile.activityScore >= 70 ? "var(--green)" : profile.activityScore >= 40 ? "var(--amber)" : "var(--red)",
                        transition: "width var(--dur-3) var(--ease-out)",
                      }} />
                    </div>
                  </div>
                )}
                <div className="mt-8" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  <h4 className="mt-0 mb-8">{t("Contact")}</h4>
                  {profile.contactName && <div><span className="muted">{t("Name:")}</span> {profile.contactName}</div>}
                  {profile.contactEmail && <div><span className="muted">{t("Email:")}</span> {profile.contactEmail}</div>}
                </div>
              </div>
              {profile.notes && (
                <div className="mt-12" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  <span className="muted">{t("Notes:")}</span>
                  <p className="mt-4 mb-0" style={{ whiteSpace: "pre-wrap" }}>{profile.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Row */}
          {isAdmin && (
            <div className="grid-2 gap-16 mt-16">
              <div className="card p-18">
                <h3 className="mt-0 mb-12">{t("Deal Stage Distribution")}</h3>
                <DealStageChart data={analytics.dealStageDistribution} />
              </div>
              <div className="card p-18">
                <h3 className="mt-0 mb-12">{t("Match Score Distribution")}</h3>
                <MatchScoreChart data={analytics.matchScoreDistribution} />
              </div>
            </div>
          )}

          {/* Status Actions (Admin) */}
          {isAdmin && (
            <div className="card p-18 mt-16">
              <h3 className="mt-0 mb-12">{t("Status Actions")}</h3>
              <div className="flex flex-wrap gap-8">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className="button-secondary text-xs"
                    style={{
                      borderColor: s === status ? STATUS_COLORS[s] : undefined,
                      color: s === status ? STATUS_COLORS[s] : undefined,
                      fontWeight: s === status ? 700 : undefined,
                    }}
                    disabled={busy || s === status}
                    onClick={() => updateStatus(s)}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Blacklist */}
          {profile.blacklist.length > 0 && isAdmin && (
            <div className="card p-18 mt-16" style={{ borderLeft: "3px solid var(--red)" }}>
              <h3 className="mt-0 mb-8">{t("Blacklist")}</h3>
              <div className="flex flex-wrap gap-6">
                {profile.blacklist.map((b) => <span key={b} className="badge badge-red text-xs">{b}</span>)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Deals Tab */}
      {activeTab === "deals" && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Related Deals")}</h3>
          {profile.deals.length === 0 ? (
            <p className="muted">{t("No deals linked to this profile yet.")}</p>
          ) : (
            <div className="apps-list">
              {profile.deals.map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/deals/${d.id}`}
                  className="apps-row flex items-center gap-10"
                >
                  <span className={`status-dot ${
                    d.stage === "FUNDED" || d.stage === "SIGNED" ? "status-dot-green" :
                    d.stage === "PASSED" ? "status-dot-red" :
                    d.stage === "DD" || d.stage === "TERM_SHEET" ? "status-dot-purple" :
                    "status-dot-amber"
                  }`} />
                  <div style={{ flex: 1 }}>
                    <div className="font-semibold">{d.title}</div>
                    <div className="muted text-xs">
                      {new Date(d.createdAt).toLocaleDateString()}
                      {d.closedAt ? ` → ${new Date(d.closedAt).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <StatusBadge status={d.stage} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === "matches" && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Match History")}</h3>
          {profile.matches.length === 0 ? (
            <p className="muted">{t("No matches generated yet.")}</p>
          ) : (
            <div className="apps-list">
              {profile.matches.map((m) => (
                <div
                  key={m.id}
                  className="apps-row flex items-center gap-10"
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                    background: m.score >= 80 ? "var(--green-bg)" : m.score >= 60 ? "var(--blue-bg)" : m.score >= 40 ? "var(--amber-bg)" : "var(--red-bg)",
                    color: m.score >= 80 ? "var(--green)" : m.score >= 60 ? "var(--blue)" : m.score >= 40 ? "var(--amber)" : "var(--red)",
                    flexShrink: 0,
                  }}>
                    {m.score}
                  </div>
                  <div style={{ flex: 1 }}>
                    {m.project ? (
                      <Link href={`/dashboard/projects/${m.project.id}`} className="font-semibold" style={{ color: "var(--accent)" }}>
                        {m.project.name}
                      </Link>
                    ) : (
                      <span className="muted">{t("Unknown project")}</span>
                    )}
                    <div className="muted text-xs">
                      {m.project?.sector ?? "—"} · {new Date(m.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DetailLayout>
  );
}
