"use client";

import { useState } from "react";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";

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
    <DetailLayout
      backHref="/dashboard/campaigns"
      backLabel="All Campaigns"
      title={campaign.title}
      subtitle={campaign.description || undefined}
      badge={<StatusBadge status={campaign.status} />}
    >
      <div className="grid-4">
        <StatCard label="Budget" value={campaign.budget ? `$${campaign.budget.toLocaleString()}` : "—"} />
        <StatCard label="Channels" value={campaign.channels.length} />
        <StatCard label="Metrics" value={campaign.metrics.length} />
        <StatCard label="Start Date" value={campaign.startAt ? new Date(campaign.startAt).toLocaleDateString() : "—"} />
      </div>

      {allowedTransitions.length > 0 && (
        <div className="flex gap-8">
          {allowedTransitions.map((s) => (
            <button key={s} className="button text-xs" disabled={busy} onClick={() => transition(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="grid-2 gap-20">
        <div className="card p-18">
          <h3 className="mb-12">Channels</h3>
          {campaign.channels.length > 0 && (
            <table className="data-table mb-12">
              <thead><tr><th>Node</th><th>Channel</th><th>Status</th></tr></thead>
              <tbody>
                {campaign.channels.map((ch) => (
                  <tr key={ch.id}>
                    <td className="text-xs">{ch.nodeId.slice(0, 8)}...</td>
                    <td>{ch.channel}</td>
                    <td><StatusBadge status={ch.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form onSubmit={addChannel} className="flex gap-8 items-end">
            <input placeholder="Node ID" value={channelForm.nodeId} onChange={(e) => setChannelForm({ ...channelForm, nodeId: e.target.value })} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required />
            <select value={channelForm.channel} onChange={(e) => setChannelForm({ ...channelForm, channel: e.target.value })} style={{ padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required>
              <option value="">Channel...</option>
              {["TWITTER", "LINKEDIN", "TELEGRAM", "NEWSLETTER", "EVENT", "REFERRAL", "OTHER"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="button text-xs" style={{ padding: "8px 14px" }}>Add</button>
          </form>
        </div>

        <div className="card p-18">
          <h3 className="mb-12">Metrics</h3>
          {campaign.metrics.length > 0 && (
            <table className="data-table mb-12">
              <thead><tr><th>Type</th><th>Value</th><th>Date</th></tr></thead>
              <tbody>
                {campaign.metrics.slice(0, 20).map((m) => (
                  <tr key={m.id}>
                    <td>{m.metricType}</td>
                    <td className="font-semibold">{m.value.toLocaleString()}</td>
                    <td className="muted text-xs">{new Date(m.recordedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form onSubmit={recordMetric} className="flex gap-8 items-end">
            <select value={metricForm.metricType} onChange={(e) => setMetricForm({ ...metricForm, metricType: e.target.value })} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required>
              <option value="">Metric type...</option>
              {["IMPRESSIONS", "CLICKS", "LEADS", "CONVERSIONS", "REACH", "ENGAGEMENT"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Value" value={metricForm.value} onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })} style={{ width: 100, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 12 }} required />
            <button type="submit" className="button text-xs" style={{ padding: "8px 14px" }}>Record</button>
          </form>
        </div>
      </div>
    </DetailLayout>
  );
}
