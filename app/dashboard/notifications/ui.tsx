"use client";

import { useState } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

const TYPE_BADGE: Record<string, string> = {
  TASK_ASSIGNED: "badge-accent", EVIDENCE_SUBMITTED: "badge-amber",
  APPROVAL_PENDING: "badge-purple", FREEZE_APPLIED: "badge-red",
  REVIEW_DECISION: "badge-green", DISPUTE_CREATED: "badge-yellow",
};

export function NotificationsUI({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications);
  const [busy, setBusy] = useState(false);

  const unreadCount = items.filter((n) => !n.readAt).length;

  async function markAllRead() {
    setBusy(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      setItems(items.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch { /* ignore */ }
    setBusy(false);
  }

  return (
    <div>
      <div className="page-toolbar notif-toolbar">
        <p className="muted">{unreadCount} unread of {items.length} total</p>
        <div className="page-toolbar-spacer" />
        {unreadCount > 0 && (
          <button className="button" disabled={busy} onClick={markAllRead}>
            Mark All Read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state card"><p>No notifications.</p></div>
      ) : (
        <div className="notif-list">
          {items.map((n) => (
            <div
              key={n.id}
              className={`notif-card${n.readAt ? "" : " notif-card-unread"}`}
            >
              <div className="notif-card-head">
                <div className="notif-card-title-row">
                  <span className={`badge ${TYPE_BADGE[n.type] ?? ""}`}>{n.type.replace(/_/g, " ")}</span>
                  <strong className="notif-card-title">{n.title}</strong>
                </div>
                <span className="muted notif-card-time">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              {n.body && <p className="muted notif-card-body">{n.body}</p>}
              {n.entityType && n.entityId && (
                <p className="muted notif-card-entity">{n.entityType} #{n.entityId.slice(0, 8)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
