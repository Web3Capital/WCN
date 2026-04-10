"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { StatCard } from "../_components";

type Distribution = { label: string; count: number }[];
type TimeSeriesPoint = { week: string; count: number };
type FunnelStage = { stage: string; count: number };
type AnomalyAlert = { metric: string; current: number; average: number; deviation: number };

type CockpitData = {
  summary: {
    activeNodes: number;
    activeProjects: number;
    activeDeals: number;
    totalTasks: number;
    totalEvidence: number;
    totalPoB: number;
    totalCapital: number;
    totalAgents: number;
    openDisputes: number;
    settledCycles: number;
  };
  distributions: {
    nodesByStatus: Distribution;
    dealsByStage: Distribution;
    pobByStatus: Distribution;
  };
  timeSeries?: {
    deals: TimeSeriesPoint[];
    pob: TimeSeriesPoint[];
    evidence: TimeSeriesPoint[];
    tasks: TimeSeriesPoint[];
  };
  funnel?: FunnelStage[];
  anomalies?: AnomalyAlert[];
};

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff"];

const NODE_COLORS: Record<string, string> = {
  LIVE: "#22c55e", APPROVED: "#22c55e", SUBMITTED: "#f59e0b", UNDER_REVIEW: "#f59e0b",
  SUSPENDED: "#ef4444", OFFBOARDED: "#ef4444", REJECTED: "#ef4444", DRAFT: "#94a3b8",
  CONTRACTING: "#a855f7", PROBATION: "#f59e0b", NEED_MORE_INFO: "#eab308",
};

const DEAL_COLORS: Record<string, string> = {
  SOURCED: "#94a3b8", MATCHED: "#f59e0b", INTRO_SENT: "#f59e0b", MEETING_DONE: "#a855f7",
  DD: "#a855f7", TERM_SHEET: "#a855f7", SIGNED: "#22c55e", FUNDED: "#22c55e",
  PASSED: "#ef4444", PAUSED: "#94a3b8",
};

function DistributionPie({ items, colorMap }: { items: Distribution; colorMap?: Record<string, string> }) {
  const total = items.reduce((a, b) => a + b.count, 0);
  if (total === 0) return <p className="muted">No data.</p>;

  return (
    <div className="flex items-center gap-16">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={items} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
            {items.map((item, i) => (
              <Cell key={item.label} fill={colorMap?.[item.label] ?? CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-col gap-4">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-6 text-xs">
            <span style={{
              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
              background: colorMap?.[item.label] ?? CHART_COLORS[i % CHART_COLORS.length],
            }} />
            <span className="muted">{item.label.replace(/_/g, " ")}</span>
            <span className="font-semibold" style={{ marginLeft: "auto" }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ data, color = "#6366f1", label }: { data: TimeSeriesPoint[]; color?: string; label: string }) {
  return (
    <div className="card p-18">
      <h3 className="mb-12">{label} / Week</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FunnelChart({ data }: { data: FunnelStage[] }) {
  return (
    <div className="card p-18">
      <h3 className="mb-12">Conversion Funnel</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={80} />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DataCockpit({ data }: { data: CockpitData }) {
  const s = data.summary;

  return (
    <div className="data-cockpit">
      {data.anomalies && data.anomalies.length > 0 && (
        <div className="card p-16 mb-16" style={{ borderLeft: "3px solid var(--red)" }}>
          <h3 className="mb-8" style={{ color: "var(--red)" }}>Anomaly Alerts</h3>
          {data.anomalies.map((a) => (
            <div key={a.metric} className="mb-4" style={{ fontSize: 13 }}>
              <strong>{a.metric}</strong>: {a.current} (avg {a.average}, {a.deviation > 0 ? "+" : ""}{a.deviation}σ)
            </div>
          ))}
        </div>
      )}

      <div className="grid-5">
        {[
          { label: "Active Nodes", value: s.activeNodes },
          { label: "Active Projects", value: s.activeProjects },
          { label: "Active Deals", value: s.activeDeals },
          { label: "Capital Profiles", value: s.totalCapital },
          { label: "Total Tasks", value: s.totalTasks },
          { label: "Total Evidence", value: s.totalEvidence },
          { label: "PoB Records", value: s.totalPoB },
          { label: "Agents", value: s.totalAgents },
          { label: "Open Disputes", value: s.openDisputes },
          { label: "Settled Cycles", value: s.settledCycles },
        ].map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      {data.timeSeries && (
        <div className="grid-2 mt-16">
          <TrendChart data={data.timeSeries.deals} color="#6366f1" label="Deals" />
          <TrendChart data={data.timeSeries.pob} color="#8b5cf6" label="PoB Records" />
          <TrendChart data={data.timeSeries.evidence} color="#22c55e" label="Evidence" />
          <TrendChart data={data.timeSeries.tasks} color="#f59e0b" label="Tasks" />
        </div>
      )}

      <div className="grid-2 mt-16">
        <div className="card p-18">
          <h3 className="mb-12">Nodes by Status</h3>
          <DistributionPie items={data.distributions.nodesByStatus} colorMap={NODE_COLORS} />
        </div>
        <div className="card p-18">
          <h3 className="mb-12">Deals by Stage</h3>
          <DistributionPie items={data.distributions.dealsByStage} colorMap={DEAL_COLORS} />
        </div>
      </div>

      {data.funnel && (
        <div className="mt-16">
          <FunnelChart data={data.funnel} />
        </div>
      )}
    </div>
  );
}
