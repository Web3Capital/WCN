"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { DetailLayout, StatusBadge } from "../../_components";
import { InternalNoteField, NoteFeed, NoteSectionCard } from "../../notes";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type ApplicationData = {
  id: string;
  status: string;
  applicantName: string;
  contact: string;
  organization: string | null;
  role: string | null;
  nodeType: string | null;
  resources: string | null;
  lookingFor: string | null;
  linkedin: string | null;
  whyWcn: string | null;
  notes: string | null;
  createdAt: string;
  userId: string | null;
  user: { id: string; name: string | null; email: string | null; role: string } | null;
};

type Review = {
  id: string;
  decision: string;
  notes: string | null;
  createdAt: string;
  reviewer: { name: string | null; email: string | null } | null;
};

const STATUSES = ["PENDING", "REVIEWING", "APPROVED", "REJECTED"];

export function ApplicationDetail({
  application,
  reviews,
  isAdmin,
}: {
  application: ApplicationData;
  reviews: Review[];
  isAdmin: boolean;
}) {
  const { t } = useAutoTranslate();
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateApp(patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.ok) {
        if (patch.status) setStatus(patch.status as string);
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
      backHref="/dashboard/node-system/applications"
      backLabel={t("All Applications")}
      title={application.applicantName}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          {application.nodeType && <span className="badge">{application.nodeType}</span>}
        </span>
      }
      meta={
        <>
          <span>{t("Submitted")} {new Date(application.createdAt).toLocaleString()}</span>
          {application.user && (
            <span>{t("User:")} <Link href={`/dashboard/users/${application.user.id}`} style={{ color: "var(--accent)" }}>{application.user.name || application.user.email || application.user.id}</Link></span>
          )}
        </>
      }
    >
      <div className="card p-18">
        <h3 className="mt-0 mb-12">{t("Applicant Information")}</h3>
        <div className="grid-2 gap-12">
          <div className="kpi">
            <strong>{t("Contact")}</strong>
            <span className="muted">{application.contact}</span>
          </div>
          <div className="kpi">
            <strong>{t("Organization")}</strong>
            <span className="muted">{application.organization ?? "—"}</span>
          </div>
          <div className="kpi">
            <strong>{t("Role")}</strong>
            <span className="muted">{application.role ?? "—"}</span>
          </div>
          <div className="kpi">
            <strong>{t("LinkedIn")}</strong>
            {application.linkedin ? (
              <a href={application.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                {application.linkedin}
              </a>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="card p-18">
        <h3 className="mt-0 mb-12">{t("Application Details")}</h3>
        <div className="flex-col gap-16">
          <div>
            <div className="label">{t("Resources & Expertise")}</div>
            <p className="mt-4 mb-0" style={{ whiteSpace: "pre-wrap" }}>{application.resources ?? "—"}</p>
          </div>
          <div>
            <div className="label">{t("Looking For")}</div>
            <p className="mt-4 mb-0" style={{ whiteSpace: "pre-wrap" }}>{application.lookingFor ?? "—"}</p>
          </div>
          <div>
            <div className="label">{t("Why WCN")}</div>
            <p className="mt-4 mb-0" style={{ whiteSpace: "pre-wrap" }}>{application.whyWcn ?? "—"}</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Review Actions")}</h3>
          <div className="grid-2 gap-12">
            <label className="field">
              <span className="label">{t("Status")}</span>
              <select
                value={status}
                onChange={(e) => updateApp({ status: e.target.value })}
                disabled={busy}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <InternalNoteField
            className="mt-8"
            label={t("Internal Notes")}
            value={notes}
            onChange={setNotes}
            onBlur={(v) => updateApp({ reviewNote: v || null })}
            placeholder={t("Add review notes...")}
            hint={t("Notes auto-save on blur.")}
          />
          {error && <p className="form-error mt-8">{error}</p>}
        </div>
      )}

      {reviews.length > 0 && (
        <NoteSectionCard title={t("Review History")} variant="solid">
          <NoteFeed
            items={reviews.map((r) => ({
              id: r.id,
              body: (
                <>
                  <span className="font-semibold">{r.decision}</span>
                  {r.notes ? <> — {r.notes}</> : null}
                </>
              ),
              meta: (
                <>
                  {r.reviewer?.name || r.reviewer?.email || "system"} · {new Date(r.createdAt).toLocaleString()}
                </>
              ),
            }))}
          />
        </NoteSectionCard>
      )}
    </DetailLayout>
  );
}
