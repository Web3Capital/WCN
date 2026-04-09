import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

export type AuditPayload = {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  workspaceId?: string | null;
};

export const AuditAction = {
  // Auth
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  TWO_FACTOR_ENABLE: "TWO_FACTOR_ENABLE",
  TWO_FACTOR_DISABLE: "TWO_FACTOR_DISABLE",
  SESSION_REVOKE_ALL: "SESSION_REVOKE_ALL",

  // Invite
  INVITE_SEND: "INVITE_SEND",
  INVITE_ACTIVATE: "INVITE_ACTIVATE",

  // User / Role
  USER_ROLE_CHANGE: "USER_ROLE_CHANGE",
  USER_STATUS_CHANGE: "USER_STATUS_CHANGE",

  // Node
  NODE_CREATE: "NODE_CREATE",
  NODE_STATUS_CHANGE: "NODE_STATUS_CHANGE",
  NODE_REVIEW: "NODE_REVIEW",
  NODE_CONTRACT_SEND: "NODE_CONTRACT_SEND",
  NODE_PROBATION: "NODE_PROBATION",
  NODE_OFFBOARD: "NODE_OFFBOARD",
  NODE_SEAT_CREATE: "NODE_SEAT_CREATE",

  // Project
  PROJECT_CREATE: "PROJECT_CREATE",
  PROJECT_STATUS_CHANGE: "PROJECT_STATUS_CHANGE",

  // Capital
  CAPITAL_CREATE: "CAPITAL_CREATE",
  CAPITAL_STATUS_CHANGE: "CAPITAL_STATUS_CHANGE",

  // Deal
  DEAL_CREATE: "DEAL_CREATE",
  DEAL_STAGE_CHANGE: "DEAL_STAGE_CHANGE",
  DEAL_PARTICIPANT_ADD: "DEAL_PARTICIPANT_ADD",
  DEAL_PARTICIPANT_REMOVE: "DEAL_PARTICIPANT_REMOVE",

  // Task
  TASK_CREATE: "TASK_CREATE",
  TASK_STATUS_CHANGE: "TASK_STATUS_CHANGE",

  // Evidence / PoB
  EVIDENCE_CREATE: "EVIDENCE_CREATE",
  EVIDENCE_REVIEW: "EVIDENCE_REVIEW",
  POB_UPDATE: "POB_UPDATE",
  POB_ATTRIBUTION_SET: "POB_ATTRIBUTION_SET",
  POB_CONFIRMATION_CREATE: "POB_CONFIRMATION_CREATE",
  POB_STATUS_CHANGE: "POB_STATUS_CHANGE",

  // Settlement
  SETTLEMENT_CYCLE_LOCK: "SETTLEMENT_CYCLE_LOCK",
  SETTLEMENT_LINES_GENERATE: "SETTLEMENT_LINES_GENERATE",
  SETTLEMENT_EXPORT: "SETTLEMENT_EXPORT",
  SETTLEMENT_REOPEN: "SETTLEMENT_REOPEN",

  // Agent
  AGENT_CREATE: "AGENT_CREATE",
  AGENT_STATUS_CHANGE: "AGENT_STATUS_CHANGE",
  AGENT_FREEZE: "AGENT_FREEZE",
  AGENT_OVERRIDE: "AGENT_OVERRIDE",

  // Review / Dispute
  APPLICATION_STATUS_CHANGE: "APPLICATION_STATUS_CHANGE",
  DISPUTE_CREATE: "DISPUTE_CREATE",
  DISPUTE_RESOLVE: "DISPUTE_RESOLVE",
  STAKE_ACTION: "STAKE_ACTION",
  PENALTY_CREATE: "PENALTY_CREATE",

  // Risk
  RISK_FLAG_CREATE: "RISK_FLAG_CREATE",
  RISK_FLAG_RESOLVE: "RISK_FLAG_RESOLVE",
  EMERGENCY_OVERRIDE: "EMERGENCY_OVERRIDE",

  // File
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_DOWNLOAD: "FILE_DOWNLOAD",
  FILE_SHARE_REVOKE: "FILE_SHARE_REVOKE",
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
          : (payload.metadata as Prisma.InputJsonValue),
      deviceInfo: payload.deviceInfo ?? null,
      ipAddress: payload.ipAddress ?? null,
      workspaceId: payload.workspaceId ?? null,
    },
  });
}
