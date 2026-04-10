"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  DIAMOND: "💎", PLATINUM: "🏆", GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉",
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
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.tier === filter);

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>No reputation scores calculated yet.</p>
        <p className="muted">Scores are calculated based on PoB, task completion, evidence quality, and more.</p>
      </div>
    );
  }

  return (
    <div>
      {history && history.length > 1 && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Network Reputation Trend</h3>
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

      <div className="page-toolbar" style={{ marginBottom: 12 }}>
        <div className="chip-group">
          {TIERS.map((t) => (
            <button key={t} className={`chip ${filter === t ? "chip-active" : ""}`} onClick={() => setFilter(t)}>
              {t === "ALL" ? `All (${entries.length})` : `${TIER_EMOJI[t] ?? ""} ${t}`}
            </button>
          ))}
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Node</th>
            <th>Type</th>
            <th>Score</th>
            <th>Tier</th>
            <th>Badges</th>
            <th>Last Calculated</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e, i) => (
            <>
              <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                <td style={{ fontWeight: 700, color: i < 3 ? "var(--accent)" : undefined }}>{i + 1}</td>
                <td>
                  <Link href={`/dashboard/nodes/${e.node.id}`} className="link" onClick={(ev) => ev.stopPropagation()}>{e.node.name}</Link>
                </td>
                <td><span className="badge">{e.node.type}</span></td>
                <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{e.score.toFixed(1)}</td>
                <td>
                  <span className={`badge ${TIER_BADGE[e.tier] ?? ""}`}>
                    {TIER_EMOJI[e.tier] ?? ""} {e.tier}
                  </span>
                </td>
                <td>
                  {e.node.badges?.length > 0
                    ? e.node.badges.map((b) => <span key={b.id} className="badge" style={{ marginRight: 4, fontSize: 10 }}>{b.badge}</span>)
                    : <span className="muted">—</span>}
                </td>
                <td className="muted" style={{ fontSize: 12 }}>{new Date(e.calculatedAt).toLocaleDateString()}</td>
              </tr>
              {expandedId === e.id && e.breakdown && (
                <tr key={`${e.id}-bd`}>
                  <td></td>
                  <td colSpan={6}><ScoreBreakdown breakdown={e.breakdown} /></td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
