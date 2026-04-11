"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, FilterToolbar, EmptyState } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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

const STATUSES = ["ALL", "GENERATED", "INTEREST_EXPRESSED", "CONVERTED_TO_DEAL", "DECLINED", "EXPIRED"] as const;

const PAGE_SIZE = 20;

export function MatchesConsole({
  initialMatches,
  isAdmin,
}: {
  initialMatches: MatchRow[];
  isAdmin: boolean;
}) {
  const { t } = useAutoTranslate();
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
        setError(data.error?.message || data.error || t("Action failed."));
      }
    } catch {
      setError(t("Network error."));
    }
    setBusy(null);
  }

  function scoreBar(label: string, value: number) {
    const pct = Math.round(value * 100);
    return (
      <div className="flex items-center gap-8" style={{ fontSize: 12 }}>
        <span className="font-semibold" style={{ width: 80 }}>{label}</span>
        <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 0.3s" }} />
        </div>
        <span className="muted text-right" style={{ width: 36 }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <FilterToolbar filters={STATUSES} active={filter} onChange={setFilter} totalCount={matches.length} />

      {error && <p className="form-error mt-8">{error}</p>}

      {filtered.length === 0 ? (
        <EmptyState message={t("No matches found.")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>{t("Project")}</th>
              <th>{t("Capital Profile")}</th>
              <th>{t("Score")}</th>
              <th>{t("Status")}</th>
              <th>{t("Created")}</th>
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
                    <Link href={`/dashboard/projects/${m.project.id}`} className="font-bold text-sm" style={{ color: "var(--accent)" }}>
                      {m.project.name}
                    </Link>
                    <div className="muted text-xs">
                      {m.project.sector ?? "—"} · {m.project.stage}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-semibold">{m.capitalProfile.name}</div>
                    <div className="muted text-xs">
                      {m.capitalProfile.investmentFocus.slice(0, 3).join(", ") || "—"}
                    </div>
                  </td>
                  <td>
                    <button
                      className="badge badge-accent font-bold text-sm"
                      style={{ cursor: "pointer", border: "none", background: "var(--accent-alpha)" }}
                      onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                      title={t("Click to see score breakdown")}
                    >
                      {m.score.toFixed(1)}
                    </button>
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="muted text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>
                    {m.status === "GENERATED" && (
                      <div className="flex gap-4">
                        <button
                          className="button"
                          style={{ fontSize: 10, padding: "3px 8px" }}
                          disabled={busy === m.id}
                          onClick={() => performAction(m.id, "interest")}
                        >
                          {t("Interest")}
                        </button>
                        <button
                          className="button-secondary"
                          style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }}
                          disabled={busy === m.id}
                          onClick={() => performAction(m.id, "decline")}
                        >
                          {t("Decline")}
                        </button>
                      </div>
                    )}
                    {m.status === "INTEREST_EXPRESSED" && (
                      <div className="flex gap-4">
                        <button
                          className="button"
                          style={{ fontSize: 10, padding: "3px 8px" }}
                          disabled={busy === m.id}
                          onClick={() => { setConvertModalId(m.id); setConvertDealId(""); }}
                        >
                          {t("Convert")}
                        </button>
                        <button
                          className="button-secondary"
                          style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }}
                          disabled={busy === m.id}
                          onClick={() => performAction(m.id, "decline")}
                        >
                          {t("Decline")}
                        </button>
                      </div>
                    )}
                    {m.convertedDealId && (
                      <Link href={`/dashboard/deals/${m.convertedDealId}`} style={{ fontSize: 11, color: "var(--accent)" }}>
                        {t("View deal")}
                      </Link>
                    )}
                  </td>
                </tr>
                {expandedId === m.id && (
                  <tr key={`${m.id}-detail`}>
                    <td></td>
                    <td colSpan={6}>
                      <div className="card p-14" style={{ margin: "4px 0 8px" }}>
                        <div style={{ display: "grid", gap: 6 }}>
                          {scoreBar(t("Sector"), m.sectorScore)}
                          {scoreBar(t("Stage"), m.stageScore)}
                          {scoreBar(t("Ticket"), m.ticketScore)}
                          {scoreBar(t("Jurisdiction"), m.jurisdictionScore)}
                        </div>
                        <div className="muted text-xs mt-8">
                          {t("Composite:")} {m.score.toFixed(2)} / 100
                          {m.expiresAt && <> · {t("Expires:")} {new Date(m.expiresAt).toLocaleDateString()}</>}
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
        <div className="flex-center gap-8 mt-16">
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page === 0} onClick={() => setPage(page - 1)}>← {t("Prev")}</button>
          <span className="muted" style={{ fontSize: 12, lineHeight: "28px" }}>{t("Page")} {page + 1} {t("of")} {totalPages}</span>
          <button className="button-secondary" style={{ fontSize: 11, padding: "4px 12px" }} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>{t("Next")} →</button>
        </div>
      )}

      {convertModalId && (
        <div className="flex-center" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} onClick={() => setConvertModalId(null)}>
          <div className="card p-24" style={{ width: 400, maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-12">{t("Convert to Deal")}</h3>
            <p className="muted text-sm mb-16">{t("Enter the Deal ID to link this match.")}</p>
            <input
              autoFocus
              placeholder={t("Deal ID")}
              value={convertDealId}
              onChange={(e) => setConvertDealId(e.target.value)}
              className="w-full mb-12"
              style={{ padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontSize: 13 }}
            />
            <div className="flex-end gap-8">
              <button className="button-secondary" onClick={() => setConvertModalId(null)}>{t("Cancel")}</button>
              <button
                className="button"
                disabled={!convertDealId.trim() || busy === convertModalId}
                onClick={() => { performAction(convertModalId, "convert", convertDealId.trim()); setConvertModalId(null); }}
              >
                {t("Convert")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
