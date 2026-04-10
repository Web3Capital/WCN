"use client";

import { useState } from "react";
import Link from "next/link";

type Campaign = {
  id: string; title: string; description: string | null; status: string;
  targetType: string | null; budget: number | null; startAt: string | null; endAt: string | null;
  channels: Array<{ id: string; nodeId: string; channel: string; status: string; deliverables: any }>;
  metrics: Array<{ id: string; metricType: string; value: number; recordedAt: string }>;
  createdAt: string;
};

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["PAUSED", "COMPLETED", "CANCELLED"],
  PAUSED: ["ACTIVE", "CANCELLED"],
};

export function CampaignDetail({ campaign: initial }: { campaign: Campaign }) {
  const [campaign, setCampaign] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [channelForm, setChannelForm] = useState({ nodeId: "", channel: "" });
  const [metricForm, setMetricForm] = useState({ metricType: "", value: "" });

  async function transition(newStatus: string) {
    setBusy(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transition", campaignId: campaign.id, status: newStatus }),
    });
    const d = await res.json();
    if (d.ok) setCampaign({ ...campaign, status: newStatus });
    setBusy(false);
  }

  async function addChannel(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assignChannel", campaignId: campaign.id, ...channelForm }),
    });
    const d = await res.json();
    if (d.ok) {
      setCampaign({ ...campaign, channels: [...campaign.channels, d.data] });
      setChannelForm({ nodeId: "", channel: "" });
    }
  }

  async function recordMetric(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recordMetric", campaignId: campaign.id, metricType: metricForm.metricType, value: parseFloat(metricForm.value) }),
    });
    const d = await res.json();
    if (d.ok) {
      setCampaign({ ...campaign, metrics: [d.data, ...campaign.metrics] });
      setMetricForm({ metricType: "", value: "" });
    }
  }

  const allowedTransitions = TRANSITIONS[campaign.status] ?? [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/campaigns" className="muted" style={{ fontSize: 13 }}>&larr; All Campaigns</Link>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>{campaign.title}</h1>
          {campaign.description && <p className="muted" style={{ margin: "4px 0 0" }}>{campaign.description}</p>}
        </div>
        <span className="badge" style={{ fontSize: 14 }}>{campaign.status}</span>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-number">{campaign.budget ? `$${campaign.budget.toLocaleString()}` : "—"}</div><div className="stat-label">Budget</div></div>
        <div className="stat-card"><div className="stat-number">{campaign.channels.length}</div><div className="stat-label">Channels</div></div>
        <div className="stat-card"><div className="stat-number">{campaign.metrics.length}</div><div className="stat-label">Metrics</div></div>
        <div className="stat-card"><div className="stat-number">{campaign.startAt ? new Date(campaign.startAt).toLocaleDateString() : "—"}</div><div className="stat-label">Start Date</div></div>
      </div>

      {allowedTransitions.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {allowedTransitions.map((s) => (
            <button key={s} className="button" disabled={busy} onClick={() => transition(s)} style={{ fontSize: 12 }}>{s}</button>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginBottom: 12 }}>Channels</h3>
          {campaign.channels.length > 0 && (
            <table className="data-table" style={{ marginBottom: 12 }}>
              <thead><tr><th>Node</th><th>Channel</th><th>Status</th></tr></thead>
              <tbody>
                {campaign.channels.map((ch) => (
                  <tr key={ch.id}>
                    <td style={{ fontSize: 12 }}>{ch.nodeId.slice(0, 8)}...</td>
                    <td>{ch.channel}</td>
                    <td><span className="badge">{ch.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form onSubmit={addChannel} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input placeholder="Node ID" value={channelForm.nodeId} onChange={(e) => setChannelForm({ ...channelForm, nodeId: e.target.value })} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required />
            <select value={channelForm.channel} onChange={(e) => setChannelForm({ ...channelForm, channel: e.target.value })} style={{ padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required>
              <option value="">Channel...</option>
              {["TWITTER", "LINKEDIN", "TELEGRAM", "NEWSLETTER", "EVENT", "REFERRAL", "OTHER"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="button" style={{ fontSize: 12, padding: "8px 14px" }}>Add</button>
          </form>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginBottom: 12 }}>Metrics</h3>
          {campaign.metrics.length > 0 && (
            <table className="data-table" style={{ marginBottom: 12 }}>
              <thead><tr><th>Type</th><th>Value</th><th>Date</th></tr></thead>
              <tbody>
                {campaign.metrics.slice(0, 20).map((m) => (
                  <tr key={m.id}>
                    <td>{m.metricType}</td>
                    <td style={{ fontWeight: 600 }}>{m.value.toLocaleString()}</td>
                    <td className="muted" style={{ fontSize: 11 }}>{new Date(m.recordedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form onSubmit={recordMetric} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <select value={metricForm.metricType} onChange={(e) => setMetricForm({ ...metricForm, metricType: e.target.value })} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required>
              <option value="">Metric type...</option>
              {["IMPRESSIONS", "CLICKS", "LEADS", "CONVERSIONS", "REACH", "ENGAGEMENT"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Value" value={metricForm.value} onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })} style={{ width: 100, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required />
            <button type="submit" className="button" style={{ fontSize: 12, padding: "8px 14px" }}>Record</button>
          </form>
        </div>
      </div>
    </div>
  );
}
