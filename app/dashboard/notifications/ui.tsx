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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Notifications</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{unreadCount} unread of {items.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button className="button" style={{ fontSize: 12 }} disabled={busy} onClick={markAllRead}>
            Mark All Read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p className="muted">No notifications.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: 14,
                background: n.readAt ? undefined : "color-mix(in oklab, var(--accent) 5%, transparent)",
                borderLeft: n.readAt ? undefined : "3px solid var(--accent)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="badge" style={{ fontSize: 10 }}>{n.type.replace(/_/g, " ")}</span>
                  <strong style={{ fontSize: 14 }}>{n.title}</strong>
                </div>
                <span className="muted" style={{ fontSize: 11 }}>{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              {n.body && <p className="muted" style={{ margin: 0, fontSize: 13 }}>{n.body}</p>}
              {n.entityType && n.entityId && (
                <p className="muted" style={{ margin: "4px 0 0", fontSize: 11 }}>
                  {n.entityType} #{n.entityId.slice(0, 8)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
