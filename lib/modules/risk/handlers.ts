/**
 * @wcn/risk — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { RiskAlertCreatedEvent, UserLoginFailedEvent, NodeStatusChangedEvent } from "@/lib/core/event-types";
import { notifyMany } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";
import { autoEvaluateEntity } from "./rule-engine";

let _initialized = false;

export function initRiskHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<UserLoginFailedEvent>(Events.USER_LOGIN_FAILED, async (payload) => {
    if (payload.attemptCount >= 5) {
      const prisma = getPrisma();
      await prisma.riskFlag.create({
        data: {
          entityType: "User",
          entityId: payload.email,
          severity: payload.attemptCount >= 10 ? "HIGH" : "MEDIUM",
          reason: `Excessive login failures: ${payload.attemptCount} attempts (IP: ${payload.ip ?? "unknown"})`,
        },
      }).catch((err) => console.error("[Risk] riskFlag create failed", err));
    }
  });

  eventBus.on<RiskAlertCreatedEvent>(Events.RISK_ALERT_CREATED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] } },
      select: { id: true },
    });
    const userIds = admins.map((a) => a.id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: `Risk alert [${payload.severity}]: ${payload.entityType}/${payload.entityId}`,
        entityType: "RiskFlag",
        entityId: payload.alertId,
      });
    }
  });

  eventBus.on<NodeStatusChangedEvent>(Events.NODE_STATUS_CHANGED, async (payload: any) => {
    try {
      const prisma = getPrisma();
      await autoEvaluateEntity(prisma, "NODE", payload.nodeId, payload);
    } catch (e) {
      console.error("[Risk] Auto-evaluate failed:", e);
    }
  });
}
