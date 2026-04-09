"use client";

import Link from "next/link";

type NodeData = {
  id: string;
  name: string;
  status: string;
  onboardingScore: number | null;
  contractSentAt: string | null;
  goLiveAt: string | null;
  projects: { id: string; name: string; status: string }[];
  tasksAsOwner: { id: string; title: string; status: string }[];
};

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: done ? "var(--green)" : "var(--line)",
        color: done ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: 700,
      }}>
        {done ? "✓" : "·"}
      </span>
      <span style={{ fontSize: 13, fontWeight: done ? 400 : 600, color: done ? "var(--muted)" : "var(--text)" }}>{label}</span>
    </div>
  );
}

export function NodeOnboardingUI({ node, isAdmin }: { node: NodeData; isAdmin: boolean }) {
  const hasContract = !!node.contractSentAt;
  const hasProjects = node.projects.length > 0;
  const hasTasks = node.tasksAsOwner.length > 0;
  const isLive = node.status === "LIVE";

  const steps = [
    { label: "Profile completed", done: true },
    { label: "Contract sent", done: hasContract },
    { label: "First pipeline project added", done: hasProjects },
    { label: "First task assigned", done: hasTasks },
    { label: "Node goes live", done: isLive },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/dashboard/nodes/${node.id}`} style={{ fontSize: 13, color: "var(--accent)" }}>
          &larr; Back to {node.name}
        </Link>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Onboarding: {node.name}</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Track onboarding progress for the first 14 days.
      </p>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Progress</h2>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{progress}%</span>
        </div>

        <div style={{ background: "var(--line)", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", borderRadius: 6, transition: "width 0.3s" }} />
        </div>

        {node.onboardingScore != null && (
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
            Onboarding Score: <strong>{node.onboardingScore}/100</strong>
          </p>
        )}

        <div style={{ display: "grid", gap: 0 }}>
          {steps.map((s) => <CheckItem key={s.label} label={s.label} done={s.done} />)}
        </div>
      </div>

      <div className="grid-4">
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Projects</p>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{node.projects.length}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Tasks Owned</p>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{node.tasksAsOwner.length}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Contract</p>
          <span className="badge" style={{ fontSize: 11 }}>{hasContract ? "Sent" : "Pending"}</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ fontSize: 11, margin: "0 0 4px" }}>Go Live</p>
          <span className="badge" style={{ fontSize: 11 }}>{node.goLiveAt ? new Date(node.goLiveAt).toLocaleDateString() : "Not yet"}</span>
        </div>
      </div>
    </div>
  );
}
