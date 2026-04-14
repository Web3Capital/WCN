"use client";

import { Fragment, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EmptyState, StatCard, DashboardDistributionPie } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type Badge = { id: string; badge: string; awardedAt: string };

type Entry = {
  id: string;
  nodeId: string;
  score: number;
  tier: string;
  breakdown: Record<string, number> | null;
  calculatedAt: string;
  node: { id: string; name: string; type: string; status: string; badges: Badge[] };
};

const TIER_BADGE: Record<string, string> = {
  DIAMOND: "badge-green", PLATINUM: "badge-green", GOLD: "badge-amber", SILVER: "", BRONZE: "",
};

const TIER_EMOJI: Record<string, string> = {
  DIAMOND: "◆", PLATINUM: "★", GOLD: "●", SILVER: "○", BRONZE: "·",
};

const TIERS = ["ALL", "DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE"] as const;

function ScoreBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const data = Object.entries(breakdown).map(([key, value]) => ({ name: key, score: value }));
  return (
    <div style={{ padding: "8px 0" }}>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, "auto"]} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
          <Tooltip />
          <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReputationLeaderboard({ entries, history }: { entries: Entry[]; history?: { week: string; avgScore: number }[] }) {
  const { t } = useAutoTranslate();
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.tier === filter);

  const tierCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entries) c[e.tier] = (c[e.tier] ?? 0) + 1;
    return c;
  }, [entries]);

  const repKpis = useMemo(() => {
    const n = entries.length;
    const avgScore = n ? Math.round((entries.reduce((s, e) => s + e.score, 0) / n) * 10) / 10 : 0;
    const badgeTotal = entries.reduce((s, e) => s + (e.node.badges?.length ?? 0), 0);
    const elite = entries.filter((e) => e.tier === "DIAMOND" || e.tier === "PLATINUM").length;
    return { n, avgScore, badgeTotal, elite };
  }, [entries]);

  const tierColors: Record<string, string> = {
    DIAMOND: "#22d3ee",
    PLATINUM: "#a78bfa",
    GOLD: "#f59e0b",
    SILVER: "#94a3b8",
    BRONZE: "#b45309",
  };

  if (entries.length === 0) {
    return (
      <EmptyState
        message={t("No reputation scores calculated yet.")}
        action={<p className="muted">{t("Scores are calculated based on PoB, task completion, evidence quality, and more.")}</p>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("Ranked nodes")} value={repKpis.n} />
        <StatCard label={t("Avg score")} value={repKpis.avgScore} />
        <StatCard label={t("Badges")} value={repKpis.badgeTotal} />
        <StatCard label={t("Diamond / Platinum")} value={repKpis.elite} />
      </div>
      {Object.keys(tierCounts).length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Tier distribution")}</h3>
          <DashboardDistributionPie data={tierCounts} colorMap={tierColors} />
        </div>
      )}
      {history && history.length > 1 && (
        <div className="card p-18 mb-16">
          <h3 className="mb-12">{t("Network Reputation Trend")}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="page-toolbar mb-12">
        <div className="chip-group">
          {TIERS.map((tier) => (
            <button key={tier} className={`chip ${filter === tier ? "chip-active" : ""}`} onClick={() => setFilter(tier)}>
              {tier === "ALL" ? `${t("All")} (${entries.length})` : `${TIER_EMOJI[tier] ?? ""} ${tier}`}
            </button>
          ))}
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>{t("Node")}</th>
            <th>{t("Type")}</th>
            <th>{t("Score")}</th>
            <th>{t("Tier")}</th>
            <th>{t("Badges")}</th>
            <th>{t("Last Calculated")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e, i) => (
            <Fragment key={e.id}>
              <tr style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                <td className="font-bold" style={{ color: i < 3 ? "var(--accent)" : undefined }}>{i + 1}</td>
                <td>
                  <Link href={`/dashboard/nodes/${e.node.id}`} className="link" onClick={(ev) => ev.stopPropagation()}>{e.node.name}</Link>
                </td>
                <td><span className="badge">{e.node.type}</span></td>
                <td className="font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{e.score.toFixed(1)}</td>
                <td>
                  <span className={`badge ${TIER_BADGE[e.tier] ?? ""}`}>
                    {TIER_EMOJI[e.tier] ?? ""} {e.tier}
                  </span>
                </td>
                <td>
                  {e.node.badges?.length > 0
                    ? e.node.badges.map((b) => <span key={b.id} className="badge text-xs" style={{ marginRight: 4 }}>{b.badge}</span>)
                    : <span className="muted">—</span>}
                </td>
                <td className="muted text-xs">{new Date(e.calculatedAt).toLocaleDateString()}</td>
              </tr>
              {expandedId === e.id && e.breakdown && (
                <tr>
                  <td></td>
                  <td colSpan={6}><ScoreBreakdown breakdown={e.breakdown} /></td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
