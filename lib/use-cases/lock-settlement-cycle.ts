/**
 * Application Service: Lock a Settlement Cycle.
 *
 * Two modes mirror the existing handler's behavior:
 *
 *   - `direct`  RECONCILED → LOCKED in one shot. Used when the actor's
 *               policy doesn't require a second approver, or for
 *               environments without dual control configured.
 *
 *   - `request` RECONCILED → LOCK_PENDING_APPROVAL. Creates an
 *               ApprovalAction; a second FINANCE_ADMIN approves
 *               separately via the approvals route. This is the
 *               maker-checker flow that the system-design doc
 *               §10 calls out as non-negotiable for finance: "Settlement
 *               LOCK / REOPEN both require FINANCE_ADMIN approval —
 *               segregation of duties is non-negotiable."
 *
 * What this owns (mirrors approve-application.ts):
 *   1. RBAC gate via `can(role, "update", "settlement")`
 *   2. Settlement SM transition validation
 *   3. Atomic update of SettlementCycle + ApprovalAction (when request) +
 *      transactional outbox event in a single Prisma `$transaction`
 *   4. Backwards-compatible explicit audit row
 *   5. Post-commit outbox dispatch (best-effort; cron is the safety net)
 *
 * Idempotency: if the cycle is already in a terminal-or-locked state
 * (LOCKED, EXPORTED, FINALIZED), return `{ ok: true, idempotent: true }`
 * without making changes. Mirrors the prior handler's safety behavior
 * for retry-prone callers.
 */
import "@/lib/core/init";
import type { Role, SettlementCycleStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeToOutbox, processOutbox } from "@/lib/core/outbox";
import { Events } from "@/lib/core/event-types";
import { canTransitionSettlement } from "@/lib/core/state-machine";
import { can } from "@/lib/permissions";

export type LockSettlementMode = "direct" | "request";

export interface LockSettlementCycleInput {
  actorUserId: string;
  actorRole: Role;
  cycleId: string;
  mode: LockSettlementMode;
  /** Optional reason persisted on the ApprovalAction (request mode only). */
  reason?: string;
  requestId?: string;
}

export type LockSettlementCycleResult =
  | {
      ok: true;
      idempotent: true;
      cycleId: string;
      currentStatus: SettlementCycleStatus;
    }
  | {
      ok: true;
      idempotent: false;
      cycleId: string;
      mode: LockSettlementMode;
      previousStatus: SettlementCycleStatus;
      newStatus: SettlementCycleStatus;
      /** Set when mode is "request" — the new ApprovalAction's id. */
      approvalId?: string;
    }
  | {
      ok: false;
      code: "FORBIDDEN" | "NOT_FOUND" | "SETTLEMENT_INVALID_STATE" | "WORKSPACE_REQUIRED";
      message: string;
      details?: Record<string, unknown>;
    };

const TERMINAL_OR_LOCKED: SettlementCycleStatus[] = ["LOCKED", "EXPORTED", "FINALIZED"];

export async function lockSettlementCycle(
  input: LockSettlementCycleInput,
): Promise<LockSettlementCycleResult> {
  if (!can(input.actorRole, "update", "settlement")) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Insufficient permissions to lock a settlement cycle.",
    };
  }

  const prisma = getPrisma();

  type TxOk =
    | { kind: "idempotent"; cycleId: string; currentStatus: SettlementCycleStatus }
    | {
        kind: "transitioned";
        cycleId: string;
        previousStatus: SettlementCycleStatus;
        newStatus: SettlementCycleStatus;
        approvalId?: string;
      };
  type TxErr = LockSettlementCycleResult & { ok: false };

  const txResult: TxOk | TxErr = await prisma.$transaction(async (tx): Promise<TxOk | TxErr> => {
    const cycle = await tx.settlementCycle.findUnique({
      where: { id: input.cycleId },
      select: { id: true, status: true, workspaceId: true },
    });
    if (!cycle) {
      return { ok: false, code: "NOT_FOUND", message: "Settlement cycle not found." };
    }

    // Idempotency: already-locked / past-locked is treated as a no-op
    // success so retries don't error.
    if (TERMINAL_OR_LOCKED.includes(cycle.status)) {
      return { kind: "idempotent", cycleId: cycle.id, currentStatus: cycle.status };
    }

    const targetStatus: SettlementCycleStatus =
      input.mode === "request" ? "LOCK_PENDING_APPROVAL" : "LOCKED";

    if (!canTransitionSettlement(cycle.status, targetStatus)) {
      return {
        ok: false,
        code: "SETTLEMENT_INVALID_STATE",
        message: `Cannot transition settlement cycle from ${cycle.status} to ${targetStatus}.`,
        details: { from: cycle.status, to: targetStatus, mode: input.mode },
      };
    }

    if (input.mode === "request") {
      // ApprovalAction.workspaceId is non-nullable in the schema. The
      // pre-existing handler silently used `?? ""` when the cycle had
      // no workspaceId — surface that as a real error so we don't write
      // empty-string approval rows.
      if (!cycle.workspaceId) {
        return {
          ok: false,
          code: "WORKSPACE_REQUIRED",
          message: "Settlement cycle must have a workspace to request approval.",
        };
      }

      const approval = await tx.approvalAction.create({
        data: {
          workspaceId: cycle.workspaceId,
          entityType: "SETTLEMENT_CYCLE",
          entityId: cycle.id,
          actionType: "LOCK",
          requestedById: input.actorUserId,
          reason: input.reason ?? null,
        },
      });

      await tx.settlementCycle.update({
        where: { id: cycle.id },
        data: { status: "LOCK_PENDING_APPROVAL", lockApprovalId: approval.id },
      });

      await writeToOutbox(
        tx,
        Events.APPROVAL_REQUESTED,
        {
          approvalId: approval.id,
          action: "LOCK",
          entityType: "SETTLEMENT_CYCLE",
          entityId: cycle.id,
          requestedBy: input.actorUserId,
        },
        { actorId: input.actorUserId, requestId: input.requestId },
      );

      return {
        kind: "transitioned",
        cycleId: cycle.id,
        previousStatus: cycle.status,
        newStatus: "LOCK_PENDING_APPROVAL",
        approvalId: approval.id,
      };
    }

    // direct mode: RECONCILED → LOCKED
    await tx.settlementCycle.update({
      where: { id: cycle.id },
      data: { status: "LOCKED", lockedById: input.actorUserId },
    });

    await writeToOutbox(
      tx,
      Events.SETTLEMENT_APPROVED,
      {
        cycleId: cycle.id,
        approvedBy: input.actorUserId,
        // Audit-handler convention (lib/core/handlers/audit.ts): the
        // onAny audit row reads `payload.entityType` / `payload.entityId`
        // for targetType / targetId. Without these, the consolidated
        // audit row would fall back to "SYSTEM" / "unknown".
        entityType: "SETTLEMENT_CYCLE",
        entityId: cycle.id,
      },
      { actorId: input.actorUserId, requestId: input.requestId },
    );

    return {
      kind: "transitioned",
      cycleId: cycle.id,
      previousStatus: cycle.status,
      newStatus: "LOCKED",
    };
  });

  if ("ok" in txResult && txResult.ok === false) {
    return txResult;
  }

  const ok = txResult as TxOk;

  if (ok.kind === "idempotent") {
    return {
      ok: true,
      idempotent: true,
      cycleId: ok.cycleId,
      currentStatus: ok.currentStatus,
    };
  }

  // Audit consolidation (resolves system-design doc §12 open question
  // #2). The explicit `writeAudit` is intentionally absent: the outbox
  // event written in-tx will fire through the `eventBus.onAny` audit
  // handler at `lib/core/handlers/audit.ts` on dispatch. Resulting rows:
  //   - direct mode → action="settlement.approved",
  //                   targetType="SETTLEMENT_CYCLE",
  //                   targetId=cycle.id
  //   - request mode → action="approval.requested",
  //                    targetType="SETTLEMENT_CYCLE",
  //                    targetId=cycle.id (from payload entityType/entityId)
  //
  // Reports filtering by the legacy `SETTLEMENT_CYCLE_LOCK` /
  // `SETTLEMENT_LOCK_APPROVAL` action labels MUST be migrated — see
  // PR description for the action-label mapping table.

  void processOutbox(10).catch((err) => {
    console.error("[lock-settlement-cycle] post-commit dispatch failed", err);
  });

  return {
    ok: true,
    idempotent: false,
    cycleId: ok.cycleId,
    mode: input.mode,
    previousStatus: ok.previousStatus,
    newStatus: ok.newStatus,
    ...(ok.approvalId ? { approvalId: ok.approvalId } : {}),
  };
}
