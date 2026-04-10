/**
 * @wcn/notification — Event Handlers
 * Handles task, application, and entity freeze notifications.
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { TaskCompletedEvent, ApplicationSubmittedEvent, EntityFrozenEvent, ApprovalRequestedEvent, ApprovalGrantedEvent } from "@/lib/core/event-types";
import { createNotification, notifyMany } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";

let _initialized = false;

export function initNotificationHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<TaskCompletedEvent>(Events.TASK_COMPLETED, async (payload) => {
    if (!payload.dealId) return;
    const prisma = getPrisma();
    const deal = await prisma.deal.findUnique({
      where: { id: payload.dealId },
      select: { leadNode: { select: { ownerUserId: true } } },
    });
    if (deal?.leadNode?.ownerUserId) {
      await createNotification({
        userId: deal.leadNode.ownerUserId,
        type: "TASK_ASSIGNED",
        title: "Task completed in your deal",
        entityType: "Task",
        entityId: payload.taskId,
      });
    }
  });

  eventBus.on<ApplicationSubmittedEvent>(Events.APPLICATION_SUBMITTED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] } },
      select: { id: true },
    });
    const userIds = admins.map((a) => a.id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: `New node application: ${payload.applicantName}`,
        entityType: "Application",
        entityId: payload.applicationId,
      });
    }
  });

  eventBus.on<EntityFrozenEvent>(Events.ENTITY_FROZEN, async (payload) => {
    const prisma = getPrisma();
    if (payload.entityType === "Node") {
      const node = await prisma.node.findUnique({
        where: { id: payload.entityId },
        select: { ownerUserId: true },
      });
      if (node?.ownerUserId) {
        await createNotification({
          userId: node.ownerUserId,
          type: "GENERAL",
          title: `Your node has been frozen: ${payload.reason}`,
          entityType: "Node",
          entityId: payload.entityId,
        });
      }
    }
  });

  eventBus.on<ApprovalRequestedEvent>(Events.APPROVAL_REQUESTED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] }, id: { not: payload.requestedBy } },
      select: { id: true },
    });
    const userIds = admins.map((a) => a.id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: `Approval needed: ${payload.action} on ${payload.entityType}`,
        entityType: "Approval",
        entityId: payload.approvalId,
      });
    }
  });

  eventBus.on<ApprovalGrantedEvent>(Events.APPROVAL_GRANTED, async (payload) => {
    const prisma = getPrisma();
    const approval = await prisma.approvalAction.findUnique({ where: { id: payload.approvalId } });
    if (!approval) return;

    if (approval.entityType === "SETTLEMENT_CYCLE" && approval.actionType === "LOCK") {
      await prisma.settlementCycle.update({
        where: { id: approval.entityId },
        data: { status: "LOCKED", lockedById: payload.grantedBy },
      }).catch(() => {});
    }

    if (approval.entityType === "SETTLEMENT_CYCLE" && approval.actionType === "REOPEN") {
      await prisma.settlementCycle.update({
        where: { id: approval.entityId },
        data: { status: "REOPENED", reopenedAt: new Date() },
      }).catch(() => {});
    }
  });
}
