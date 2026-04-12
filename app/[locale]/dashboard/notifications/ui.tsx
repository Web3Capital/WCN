"use client";

import { useState } from "react";
import { StatusBadge, EmptyState } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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
  const { t } = useAutoTranslate();
  const [items, setItems] = useState(notifications);
  const [busy, setBusy] = useState(false);

  const unreadCount = items.filter((n) => !n.readAt).length;

  async function markAllRead() {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (!res.ok) throw new Error(`Mark read failed: ${res.status}`);
      setItems(items.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch (err) { console.error("[Notifications] mark all read failed", err); }
    setBusy(false);
  }

  return (
    <div>
      <div className="page-toolbar notif-toolbar">
        <p className="muted">{t(`${unreadCount} unread of ${items.length} total`)}</p>
        <div className="page-toolbar-spacer" />
        {unreadCount > 0 && (
          <button className="button" disabled={busy} onClick={markAllRead}>
            {t("Mark All Read")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState message={t("No notifications.")} />
      ) : (
        <div className="notif-list">
          {items.map((n) => (
            <div
              key={n.id}
              className={`notif-card${n.readAt ? "" : " notif-card-unread"}`}
            >
              <div className="notif-card-head">
                <div className="notif-card-title-row">
                  <StatusBadge status={n.type} />
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
