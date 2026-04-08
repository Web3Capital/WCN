import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

export type AuditPayload = {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
};

export const AuditAction = {
  POB_UPDATE: "POB_UPDATE",
  POB_ATTRIBUTION_SET: "POB_ATTRIBUTION_SET",
  POB_CONFIRMATION_CREATE: "POB_CONFIRMATION_CREATE",
  SETTLEMENT_CYCLE_LOCK: "SETTLEMENT_CYCLE_LOCK",
  SETTLEMENT_LINES_GENERATE: "SETTLEMENT_LINES_GENERATE",
  APPLICATION_STATUS_CHANGE: "APPLICATION_STATUS_CHANGE",
  USER_ROLE_CHANGE: "USER_ROLE_CHANGE",
  NODE_CREATE: "NODE_CREATE",
  PROJECT_CREATE: "PROJECT_CREATE",
  TASK_CREATE: "TASK_CREATE",
  AGENT_CREATE: "AGENT_CREATE",
  DISPUTE_CREATE: "DISPUTE_CREATE",
  DISPUTE_RESOLVE: "DISPUTE_RESOLVE",
  STAKE_ACTION: "STAKE_ACTION",
  PENALTY_CREATE: "PENALTY_CREATE",
  NODE_SEAT_CREATE: "NODE_SEAT_CREATE"
} as const;

export async function writeAudit(payload: AuditPayload): Promise<void> {
  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      actorUserId: payload.actorUserId,
      action: payload.action,
      targetType: payload.targetType,
      targetId: payload.targetId,
      metadata:
        payload.metadata === null || payload.metadata === undefined
          ? undefined
          : (payload.metadata as Prisma.InputJsonValue)
    }
  });
}
