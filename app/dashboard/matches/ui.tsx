"use client";

import { useState } from "react";
import Link from "next/link";

type MatchRow = {
  id: string;
  projectId: string;
  capitalProfileId: string;
  capitalNodeId: string;
  score: number;
  sectorScore: number;
  stageScore: number;
  ticketScore: number;
  jurisdictionScore: number;
  status: string;
  interestAt: string | null;
  declinedAt: string | null;
  convertedDealId: string | null;
  expiresAt: string | null;
  createdAt: string;
  project: { id: string; name: string; sector: string | null; stage: string; status: string };
  capitalProfile: { id: string; name: string; status: string; investmentFocus: string[] };
};

const STATUS_BADGE: Record<string, string> = {
  GENERATED: "badge-amber",
  INTEREST_EXPRESSED: "badge-accent",
  CONVERTED_TO_DEAL: "badge-green",
  DECLINED: "badge-red",
  EXPIRED: "",
};

const STATUSES = ["ALL", "GENERATED", "INTEREST_EXPRESSED", "CONVERTED_TO_DEAL", "DECLINED", "EXPIRED"] as const;

const PAGE_SIZE = 20;

export function MatchesConsole({
  initialMatches,
  isAdmin,
}: {
  initialMatches: MatchRow[];
  isAdmin: boolean;
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [convertModalId, setConvertModalId] = useState<string | null>(null);
  const [convertDealId, setConvertDealId] = useState("");

  const allFiltered = filter === "ALL" ? matches : matches.filter((m) => m.status === filter);
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filtered = allFiltered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function performAction(matchId: string, action: "interest" | "decline" | "convert", dealId?: string) {
    setBusy(matchId);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, dealId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, ...data.data, project: m.project, capitalProfile: m.capitalProfile } : m))
        );
      } else {
        setError(data.error?.message || data.error || "Action failed.");
      }
    } catch {
      setError("Network error.");
    }
    setBusy(null);
  }

  function scoreBar(label: string, value: number) {
    const pct = Math.round(value * 100);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        <span style={{ width: 80, fontWeight: 600 }}>{label}</span>
        <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 0.3s" }} />
        </div>
        <span className="muted" style={{ width: 36, textAlign: "right" }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div className="page-toolbar">
        <div className="chip-group">
          {STATUSES.map((s) => (
            <button key={s} className={`chip ${filter === s ? "chip-active" : ""}`} onClick={() => setFilter(s)}>
              {s === "ALL" ? `All (${matches.length})` : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}

      {filtered.length === 0 ? (
        <div className="empty-state"><p>No matches found.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Project</th>
              <th>Capital Profile</th>
              <th>Score</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <>
                <tr key={m.id}>
                  <td>
                    <span className={`status-dot ${m.status === "CONVERTED_TO_DEAL" ? "status-dot-green" : m.status === "DECLINED" || m.status === "EXPIRED" ? "status-dot-red" : "status-dot-amber"}`} />
                  </td>
                  <td>
                    <Link href={`/dashboard/projects/${m.project.id}`} style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>
                      {m.project.name}
                    </Link>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {m.project.sector ?? "—"} · {m.project.stage}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.capitalProfile.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {m.capitalProfile.investmentFocus.slice(0, 3).join(", ") || "—"}
                    </div>
                  </td>
                  <td>
                    <button
                      className="badge badge-accent"
                      style={{ cursor: "pointer", fontWeight: 700, fontSize: 13, border: "none", background: "var(--accent-alpha)" }}
                      onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                      title="Click to see score breakdown"
                    >
                      {m.score.toFixed(1)}
                    </button>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[m.status] ?? ""}`}>{m.status.replace(/_/g, " ")}</span>
                  </td>
                  <td className="muted" style={{ fontSize: 11 }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>
                    {m.status === "GENERATED" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="button"
                          style={{ fontSize: 10, padding: "3px 8px" }}
                          disabled={busy === m.id}
                          onClick={() => performAction(m.id, "interest")}
                        >
                          Interest
                        </button>
                        <button
                          className="button-secondary"
                          style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }}
                          disabled={busy === m.id}
                          onClick={() => performAction(m.id, "decline")}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {m.status === "INTEREST_EXPRESSED" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="button"
                          style={{ fontSize: 10, padding: "3px 8px" }}
                          disabled={busy === m.id}
                          onClick={() => { setConvertModalId(m.id); setConvertDealId(""); }}
                        >
                          Convert
                        </button>
                        <button
                          className="button-secondary"
                          style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }}
                          disabled={busy === m.id}
                          onClick={() => performAction(m.id, "decline")}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {m.convertedDealId && (
                      <Link href={`/dashboard/deals/${m.convertedDealId}`} style={{ fontSize: 11, color: "var(--accent)" }}>
                        View deal
                      </Link>
                    )}
                  </td>
                </tr>
                {expandedId === m.id && (
                  <tr key={`${m.id}-detail`}>
                    <td></td>
                    <td colSpan={6}>
                      <div className="card" style={{ padding: 14, margin: "4px 0 8px" }}>
                        <div style={{ display: "grid", gap: 6 }}>
                          {scoreBar("Sector", m.sectorScore)}
                          {scoreBar("Stage", m.stageScore)}
                          {scoreBar("Ticket", m.ticketScore)}
                          {scoreBar("Jurisdiction", m.jurisdictionScore)}
                        </div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
                          Composite: {m.score.toFixed(2)} / 100
                          {m.expiresAt && <> · Expires: {new Date(m.expiresAt).toLocaleDateString()}</>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted" style={{ fontSize: 12, lineHeight: "28px" }}>Page {page + 1} of {totalPages}</span>
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {convertModalId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setConvertModalId(null)}>
          <div className="card" style={{ padding: 24, width: 400, maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Convert to Deal</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Enter the Deal ID to link this match.</p>
            <input
              autoFocus
              placeholder="Deal ID"
              value={convertDealId}
              onChange={(e) => setConvertDealId(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 13, marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="button-secondary" onClick={() => setConvertModalId(null)}>Cancel</button>
              <button
                className="button"
                disabled={!convertDealId.trim() || busy === convertModalId}
                onClick={() => { performAction(convertModalId, "convert", convertDealId.trim()); setConvertModalId(null); }}
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
