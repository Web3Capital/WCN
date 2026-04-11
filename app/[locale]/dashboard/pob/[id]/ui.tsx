"use client";

import { useState } from "react";
import Link from "next/link";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";

type Attribution = {
  id: string;
  nodeId: string;
  role: string;
  shareBps: number;
  node?: { id: string; name: string } | null;
};

type Confirmation = {
  id: string;
  decision: string;
  partyType: string;
  partyUserId: string | null;
  partyNodeId: string | null;
  notes: string | null;
  createdAt: string;
};

type Dispute = {
  id: string;
  status: string;
  reason: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type PobData = {
  id: string;
  businessType: string;
  baseValue: number;
  weight: number;
  qualityMult: number;
  timeMult: number;
  riskDiscount: number;
  score: number;
  status: string;
  pobEventStatus: string;
  notes: string | null;
  frozenAt: string | null;
  frozenReason: string | null;
  task: { id: string; title: string; status: string } | null;
  project: { id: string; name: string } | null;
  node: { id: string; name: string } | null;
  deal: { id: string; title: string; stage: string } | null;
  attributions: Attribution[];
  confirmations: Confirmation[];
  disputes: Dispute[];
  createdAt: string;
  updatedAt: string;
};

type Review = {
  id: string;
  decision: string;
  notes: string | null;
  createdAt: string;
  reviewer: { name: string | null; email: string | null } | null;
};

const POB_STATUSES = ["PENDING", "REVIEWING", "APPROVED", "REJECTED"];
const EVENT_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "EFFECTIVE", "REJECTED", "FROZEN"];

export function PobDetail({
  record,
  reviews,
  isAdmin,
}: {
  record: PobData;
  reviews: Review[];
  isAdmin: boolean;
}) {
  const { t } = useAutoTranslate();
  const [status, setStatus] = useState(record.status);
  const [eventStatus, setEventStatus] = useState(record.pobEventStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchRecord(patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pob/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.ok) {
        if (patch.status) setStatus(patch.status as string);
        if (patch.pobEventStatus) setEventStatus(patch.pobEventStatus as string);
      } else {
        setError(data.error?.message || data.error || t("Update failed."));
      }
    } catch {
      setError(t("Network error."));
    }
    setBusy(false);
  }

  return (
    <DetailLayout
      backHref="/dashboard/pob"
      backLabel={t("All PoB")}
      title={record.businessType}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          <StatusBadge status={eventStatus} />
        </span>
      }
      meta={
        <>
          <span>{t("Score:")}{" "}<strong>{record.score}</strong></span>
          {record.node && <span>{t("Node:")}{" "}<Link href={`/dashboard/nodes/${record.node.id}`} style={{ color: "var(--accent)" }}>{record.node.name}</Link></span>}
          {record.project && <span>{t("Project:")}{" "}<Link href={`/dashboard/projects/${record.project.id}`} style={{ color: "var(--accent)" }}>{record.project.name}</Link></span>}
          {record.deal && <span>{t("Deal:")}{" "}<Link href={`/dashboard/deals/${record.deal.id}`} style={{ color: "var(--accent)" }}>{record.deal.title}</Link></span>}
          {record.task && <span>{t("Task:")}{" "}<Link href={`/dashboard/tasks/${record.task.id}`} style={{ color: "var(--accent)" }}>{record.task.title}</Link></span>}
        </>
      }
    >
      <div className="card p-18">
        <h3 className="mt-0 mb-12">{t("Score Breakdown")}</h3>
        <div className="grid-2 gap-12">
          <StatCard label={t("Base Value")} value={record.baseValue} />
          <StatCard label={t("Weight")} value={record.weight} />
          <StatCard label={t("Quality Mult")} value={record.qualityMult} />
          <StatCard label={t("Time Mult")} value={record.timeMult} />
          <StatCard label={t("Risk Discount")} value={record.riskDiscount} />
          <StatCard label={t("Final Score")} value={record.score} />
        </div>
      </div>

      {isAdmin && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Status Transition")}</h3>
          <div className="grid-2 gap-12">
            <label className="field">
              <span className="label">{t("Review Status")}</span>
              <select
                value={status}
                onChange={(e) => patchRecord({ status: e.target.value })}
                disabled={busy}
              >
                {POB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Event Status")}</span>
              <select
                value={eventStatus}
                onChange={(e) => patchRecord({ pobEventStatus: e.target.value })}
                disabled={busy}
              >
                {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="form-error mt-8">{error}</p>}
        </div>
      )}

      {record.frozenAt && (
        <div className="card p-18" style={{ borderLeft: "3px solid var(--red)" }}>
          <h3 className="mt-0 mb-4" style={{ color: "var(--red)" }}>{t("Frozen")}</h3>
          <p className="muted mt-0 mb-0">
            {t("Frozen at")} {new Date(record.frozenAt).toLocaleString()}
            {record.frozenReason && <> — {record.frozenReason}</>}
          </p>
        </div>
      )}

      {record.notes && (
        <div className="card p-18">
          <h3 className="mt-0 mb-8">{t("Notes")}</h3>
          <p className="mt-0 mb-0" style={{ whiteSpace: "pre-wrap" }}>{record.notes}</p>
        </div>
      )}

      <div className="grid-2 gap-16">
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Attribution")} ({record.attributions.length})</h3>
          {record.attributions.length === 0 ? (
            <p className="muted mt-0 mb-0">{t("No attributions recorded.")}</p>
          ) : (
            <div className="flex-col gap-8">
              {record.attributions.map((a) => (
                <div key={a.id} className="flex items-center gap-8 text-base">
                  <span className="status-dot status-dot-accent" />
                  <span className="font-semibold">{a.node?.name ?? a.nodeId}</span>
                  <span className="badge text-xs">{a.role}</span>
                  <span className="badge badge-accent text-xs">{a.shareBps} bps ({Math.round(a.shareBps / 100)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Confirmations")} ({record.confirmations.length})</h3>
          {record.confirmations.length === 0 ? (
            <p className="muted mt-0 mb-0">{t("No confirmations yet.")}</p>
          ) : (
            <div className="flex-col gap-8">
              {record.confirmations.map((c) => (
                <div key={c.id} className="flex-between text-base">
                  <div className="flex items-center gap-8">
                    <span className={`status-dot ${c.decision === "CONFIRM" ? "status-dot-green" : "status-dot-red"}`} />
                    <span className="font-semibold">{c.decision}</span>
                    <span className="badge text-xs">{c.partyType}</span>
                  </div>
                  <span className="muted text-xs">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {record.disputes.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Disputes")} ({record.disputes.length})</h3>
          <div className="flex-col gap-8">
            {record.disputes.map((d) => (
              <div key={d.id} className="flex-between text-base">
                <div className="flex items-center gap-8">
                  <StatusBadge status={d.status} />
                  <span>{d.reason}</span>
                </div>
                <Link href={`/dashboard/disputes/${d.id}`} className="text-xs" style={{ color: "var(--accent)" }}>
                  {t("View")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Review History")}</h3>
          <div className="timeline">
            {reviews.map((r) => (
              <div key={r.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <div className="text-base">
                    <span className="font-bold">{r.decision}</span>
                    {r.notes && <> — {r.notes}</>}
                  </div>
                  <div className="timeline-meta">
                    {r.reviewer?.name || r.reviewer?.email || "system"} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="muted text-xs">
        {t("Created:")} {new Date(record.createdAt).toLocaleString()} · {t("Updated:")} {new Date(record.updatedAt).toLocaleString()}
      </div>
    </DetailLayout>
  );
}
