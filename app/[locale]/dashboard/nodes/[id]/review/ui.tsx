"use client";

import { useState } from "react";
import { DetailLayout, StatusBadge, EmptyState } from "../../../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type ReviewData = {
  id: string;
  decision: string;
  notes: string | null;
  createdAt: string;
  reviewer: { name: string | null; email: string | null } | null;
};

type NodeData = {
  id: string;
  name: string;
  status: string;
  type: string;
};

const DECISIONS = ["APPROVE", "REJECT", "NEEDS_CHANGES"] as const;
const DECISION_BADGE: Record<string, string> = {
  APPROVE: "badge-green", REJECT: "badge-red", NEEDS_CHANGES: "badge-yellow",
};

export function NodeReviewUI({ node, reviews }: { node: NodeData; reviews: ReviewData[] }) {
  const { t } = useAutoTranslate();
  const [decision, setDecision] = useState<string>("APPROVE");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewDecision: decision, reviewNotes: notes }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error || t("Failed."));
      else setSuccess(t("Review submitted."));
    } catch {
      setError(t("Network error."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DetailLayout
      backHref={`/dashboard/nodes/${node.id}`}
      backLabel={t(`Back to ${node.name}`)}
      title={t(`Review: ${node.name}`)}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={node.status} />
          <span className="badge">{node.type}</span>
        </span>
      }
    >
      <div className="card p-20">
        <h2 className="text-lg font-semibold mb-12 mt-0">{t("Submit Review")}</h2>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span className="label">{t("Decision")}</span>
            <select value={decision} onChange={(e) => setDecision(e.target.value)}>
              {DECISIONS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">{t("Notes")}</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p style={{ color: "var(--green)", margin: 0, fontSize: 13 }} role="status">{success}</p>}
          <button type="submit" className="button" disabled={busy} style={{ justifySelf: "start" }}>
            {busy ? t("Submitting...") : t("Submit Review")}
          </button>
        </form>
      </div>

      <div className="card p-20">
        <h2 className="text-lg font-semibold mb-12 mt-0">{t("Review History")} ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <EmptyState message={t("No reviews yet.")} />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>{t("Decision")}</th><th>{t("Reviewer")}</th><th>{t("Date")}</th><th>{t("Notes")}</th></tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td><span className={`badge ${DECISION_BADGE[r.decision] ?? ""}`}>{r.decision}</span></td>
                  <td className="text-xs">{r.reviewer?.name ?? r.reviewer?.email ?? t("Unknown")}</td>
                  <td className="muted text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="text-sm">{r.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DetailLayout>
  );
}
