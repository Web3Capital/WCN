"use client";

import Link from "next/link";

type Entry = {
  id: string;
  nodeId: string;
  score: number;
  tier: string;
  calculatedAt: string;
  node: { id: string; name: string; type: string; status: string };
};

const TIER_BADGE: Record<string, string> = {
  DIAMOND: "badge-green",
  PLATINUM: "badge-green",
  GOLD: "badge-amber",
  SILVER: "",
  BRONZE: "",
};

const TIER_EMOJI: Record<string, string> = {
  DIAMOND: "💎",
  PLATINUM: "🏆",
  GOLD: "🥇",
  SILVER: "🥈",
  BRONZE: "🥉",
};

export function ReputationLeaderboard({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>No reputation scores calculated yet.</p>
        <p className="muted">Scores are calculated based on PoB, task completion, evidence quality, and more.</p>
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: 40 }}>#</th>
          <th>Node</th>
          <th>Type</th>
          <th>Score</th>
          <th>Tier</th>
          <th>Last Calculated</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.id}>
            <td style={{ fontWeight: 700, color: i < 3 ? "var(--accent)" : undefined }}>{i + 1}</td>
            <td>
              <Link href={`/dashboard/nodes/${e.node.id}`} className="link">{e.node.name}</Link>
            </td>
            <td><span className="badge">{e.node.type}</span></td>
            <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{e.score.toFixed(1)}</td>
            <td>
              <span className={`badge ${TIER_BADGE[e.tier] ?? ""}`}>
                {TIER_EMOJI[e.tier] ?? ""} {e.tier}
              </span>
            </td>
            <td className="muted" style={{ fontSize: 12 }}>{new Date(e.calculatedAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
