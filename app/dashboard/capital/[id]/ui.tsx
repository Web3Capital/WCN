"use client";

import { useState } from "react";
import Link from "next/link";
import { DetailLayout, StatusBadge } from "../../_components";

type CapitalData = {
  id: string;
  name: string;
  status: string;
  entity: string | null;
  investmentFocus: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  jurisdictionLimit: string[];
  structurePref: string[];
  blacklist: string[];
  restrictions: string | null;
  responseSpeed: number | null;
  activityScore: number | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  node: { id: string; name: string } | null;
  deals: { id: string; title: string; stage: string }[];
};

const STATUSES = ["PROSPECT", "QUALIFIED", "ACTIVE", "WARM", "IN_DD", "CLOSED", "PASSED", "DORMANT"];

export function CapitalDetail({ profile, isAdmin }: { profile: CapitalData; isAdmin: boolean }) {
  const [status, setStatus] = useState(profile.status);
  const [busy, setBusy] = useState(false);

  async function updateStatus(s: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/capital/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      const data = await res.json();
      if (data.ok) setStatus(s);
    } finally { setBusy(false); }
  }

  return (
    <DetailLayout
      backHref="/dashboard/capital"
      backLabel="All Capital"
      title={profile.name}
      subtitle={profile.entity || undefined}
      badge={<StatusBadge status={status} />}
      meta={profile.node ? (
        <span>Node: <Link href={`/dashboard/nodes/${profile.node.id}`} style={{ color: "var(--accent)" }}>{profile.node.name}</Link></span>
      ) : undefined}
    >
      <div className="grid-2 gap-16">
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Investment Profile</h3>
          <div className="flex-col gap-8 text-base">
            {(profile.ticketMin != null || profile.ticketMax != null) && (
              <div><span className="muted">Ticket range:</span> ${profile.ticketMin?.toLocaleString() ?? "?"} – ${profile.ticketMax?.toLocaleString() ?? "?"}</div>
            )}
            {profile.investmentFocus.length > 0 && (
              <div>
                <span className="muted">Focus:</span>
                <div className="flex flex-wrap gap-6 mt-4">
                  {profile.investmentFocus.map((f) => <span key={f} className="badge text-xs">{f}</span>)}
                </div>
              </div>
            )}
            {profile.structurePref.length > 0 && (
              <div><span className="muted">Structure:</span> <span style={{ marginLeft: 6 }}>{profile.structurePref.join(", ")}</span></div>
            )}
            {profile.jurisdictionLimit.length > 0 && (
              <div><span className="muted">Jurisdiction limits:</span> <span style={{ marginLeft: 6 }}>{profile.jurisdictionLimit.join(", ")}</span></div>
            )}
            {profile.restrictions && <div><span className="muted">Restrictions:</span> {profile.restrictions}</div>}
          </div>
        </div>

        <div className="card p-18">
          <h3 className="mt-0 mb-12">Contact & Metrics</h3>
          <div className="flex-col gap-8 text-base">
            {profile.contactName && <div><span className="muted">Contact:</span> {profile.contactName}</div>}
            {profile.contactEmail && <div><span className="muted">Email:</span> {profile.contactEmail}</div>}
            {profile.responseSpeed != null && <div><span className="muted">Response speed:</span> {profile.responseSpeed} days</div>}
            {profile.activityScore != null && <div><span className="muted">Activity score:</span> {profile.activityScore}</div>}
          </div>
          {profile.notes && (
            <div className="mt-12">
              <span className="muted">Notes:</span>
              <p className="mt-4 mb-0" style={{ whiteSpace: "pre-wrap" }}>{profile.notes}</p>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Status Actions</h3>
          <div className="flex flex-wrap gap-8">
            {STATUSES.map((s) => (
              <button
                key={s}
                className="button-secondary text-xs"
                disabled={busy || s === status}
                onClick={() => updateStatus(s)}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {profile.deals.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Related Deals</h3>
          <div className="flex-col gap-8">
            {profile.deals.map((d) => (
              <div key={d.id} className="flex items-center gap-8 text-base">
                <span className="status-dot status-dot-accent" />
                <span className="font-semibold">{d.title}</span>
                <span className="badge badge-purple text-xs">{d.stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.blacklist.length > 0 && isAdmin && (
        <div className="card p-18" style={{ borderLeft: "3px solid var(--red)" }}>
          <h3 className="mt-0 mb-8">Blacklist</h3>
          <div className="flex flex-wrap gap-6">
            {profile.blacklist.map((b) => <span key={b} className="badge badge-red text-xs">{b}</span>)}
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
