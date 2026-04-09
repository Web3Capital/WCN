"use client";

import { useState } from "react";
import Link from "next/link";

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
const STATUS_BADGE: Record<string, string> = {
  PROSPECT: "", QUALIFIED: "badge-amber", ACTIVE: "badge-green",
  WARM: "badge-accent", IN_DD: "badge-purple", CLOSED: "badge-green",
  PASSED: "badge-red", DORMANT: "",
};

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
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="eyebrow">Capital</span>
        <span className={`badge ${STATUS_BADGE[status] ?? ""}`}>{status}</span>
      </div>
      <h1 style={{ marginTop: 4 }}>{profile.name}</h1>
      {profile.entity && <p className="muted" style={{ margin: "2px 0 0" }}>{profile.entity}</p>}
      {profile.node && (
        <p className="muted" style={{ margin: "4px 0 0" }}>
          Node: <Link href={`/dashboard/nodes/${profile.node.id}`} style={{ color: "var(--accent)" }}>{profile.node.name}</Link>
        </p>
      )}

      <div className="grid-2" style={{ marginTop: 20, gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Investment Profile</h3>
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            {(profile.ticketMin != null || profile.ticketMax != null) && (
              <div><span className="muted">Ticket range:</span> ${profile.ticketMin?.toLocaleString() ?? "?"} – ${profile.ticketMax?.toLocaleString() ?? "?"}</div>
            )}
            {profile.investmentFocus.length > 0 && (
              <div>
                <span className="muted">Focus:</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {profile.investmentFocus.map((f) => <span key={f} className="badge" style={{ fontSize: 11 }}>{f}</span>)}
                </div>
              </div>
            )}
            {profile.structurePref.length > 0 && (
              <div>
                <span className="muted">Structure:</span>
                <span style={{ marginLeft: 6 }}>{profile.structurePref.join(", ")}</span>
              </div>
            )}
            {profile.jurisdictionLimit.length > 0 && (
              <div>
                <span className="muted">Jurisdiction limits:</span>
                <span style={{ marginLeft: 6 }}>{profile.jurisdictionLimit.join(", ")}</span>
              </div>
            )}
            {profile.restrictions && <div><span className="muted">Restrictions:</span> {profile.restrictions}</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Contact & Metrics</h3>
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            {profile.contactName && <div><span className="muted">Contact:</span> {profile.contactName}</div>}
            {profile.contactEmail && <div><span className="muted">Email:</span> {profile.contactEmail}</div>}
            {profile.responseSpeed != null && <div><span className="muted">Response speed:</span> {profile.responseSpeed} days</div>}
            {profile.activityScore != null && <div><span className="muted">Activity score:</span> {profile.activityScore}</div>}
          </div>
          {profile.notes && (
            <div style={{ marginTop: 12 }}>
              <span className="muted">Notes:</span>
              <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{profile.notes}</p>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Status Actions</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className="button-secondary"
                style={{ fontSize: 12 }}
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
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Related Deals</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {profile.deals.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-accent" />
                <span style={{ fontWeight: 600 }}>{d.title}</span>
                <span className="badge badge-purple" style={{ fontSize: 11 }}>{d.stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.blacklist.length > 0 && isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16, borderLeft: "3px solid var(--red)" }}>
          <h3 style={{ margin: "0 0 8px" }}>Blacklist</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {profile.blacklist.map((b) => <span key={b} className="badge badge-red" style={{ fontSize: 11 }}>{b}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
