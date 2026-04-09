"use client";

type Distribution = { label: string; count: number }[];

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
};

function DistributionBar({ items, colorMap }: { items: Distribution; colorMap?: Record<string, string> }) {
  const total = items.reduce((a, b) => a + b.count, 0);
  if (total === 0) return <p className="muted distribution-empty">No data.</p>;

  return (
    <div>
      <div className="distribution-bar">
        {items.map((item) => (
          <div
            key={item.label}
            title={`${item.label}: ${item.count}`}
            className="distribution-segment"
            style={{
              width: `${(item.count / total) * 100}%`,
              background: colorMap?.[item.label] ?? "var(--accent)",
              minWidth: item.count > 0 ? 3 : 0,
            }}
          />
        ))}
      </div>
      <div className="distribution-legend">
        {items.map((item) => (
          <div key={item.label}>
            <span
              className="distribution-legend-dot"
              style={{ background: colorMap?.[item.label] ?? "var(--accent)" }}
            />
            <span className="muted">{item.label.replace(/_/g, " ")}:</span>
            <span className="distribution-legend-value">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NODE_COLORS: Record<string, string> = {
  LIVE: "var(--green)", APPROVED: "var(--green)", SUBMITTED: "var(--amber)", UNDER_REVIEW: "var(--amber)",
  SUSPENDED: "var(--red)", OFFBOARDED: "var(--red)", REJECTED: "var(--red)", DRAFT: "var(--muted)",
  CONTRACTING: "var(--purple)", PROBATION: "var(--amber)", NEED_MORE_INFO: "var(--yellow)",
};
const DEAL_COLORS: Record<string, string> = {
  SOURCED: "var(--muted)", MATCHED: "var(--amber)", INTRO_SENT: "var(--amber)", MEETING_DONE: "var(--purple)",
  DD: "var(--purple)", TERM_SHEET: "var(--purple)", SIGNED: "var(--green)", FUNDED: "var(--green)",
  PASSED: "var(--red)", PAUSED: "var(--muted)",
};
const POB_COLORS: Record<string, string> = {
  CREATED: "var(--muted)", PENDING_REVIEW: "var(--amber)", EFFECTIVE: "var(--green)",
  REJECTED: "var(--red)", FROZEN: "var(--purple)",
};

export function DataCockpit({ data }: { data: CockpitData }) {
  const s = data.summary;

  return (
    <div className="data-cockpit">
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
          <div key={m.label} className="stat-card">
            <div className="stat-number">{m.value}</div>
            <div className="stat-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: 18 }}>
          <h3>Nodes by Status</h3>
          <DistributionBar items={data.distributions.nodesByStatus} colorMap={NODE_COLORS} />
        </div>
        <div className="card" style={{ padding: 18 }}>
          <h3>Deals by Stage</h3>
          <DistributionBar items={data.distributions.dealsByStage} colorMap={DEAL_COLORS} />
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h3>PoB Event Status</h3>
        <DistributionBar items={data.distributions.pobByStatus} colorMap={POB_COLORS} />
      </div>
    </div>
  );
}
