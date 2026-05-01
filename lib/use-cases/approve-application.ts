/**
 * Application Service: Approve / Reject a node application.
 *
 * What this owns:
 *   1. RBAC gate (canAccessNodeReviewQueue)
 *   2. Application status transition validation
 *   3. Atomic update of Application + Review record + transactional outbox event
 *   4. Backwards-compatible explicit audit row
 *   5. Post-commit outbox dispatch (best-effort; cron is the durable safety net)
 *
 * What this does NOT own (and why):
 *   - Node creation / Node SM transition. The Application table has NO
 *     foreign key to Node in the current schema (see prisma/schema.prisma
 *     `model Application`). Node provisioning is handled downstream by a
 *     handler subscribed to `APPLICATION_APPROVED`. Keeping Node out of
 *     this use-case avoids hard-coding an order that doesn't exist in the
 *     schema and matches the original handler's `nodeId: ""` placeholder.
 *   - Notifications. They subscribe to outbox events.
 *   - Escalation (Application.escalatedTo / escalatedAt). The pre-existing
 *     handler accepted these as a backdoor outside the zod schema; that is
 *     a different concern (in-flight review status), not approve/reject.
 *     Belongs in a separate `escalateApplication` use-case.
 *
 * Audit: the canonical audit row is written by the `eventBus.onAny`
 * subscriber at `lib/core/handlers/audit.ts` when the outbox event is
 * dispatched. The action label is the event name itself (e.g.
 * "application.approved"); targetType / targetId come from the payload's
 * entityType / entityId fields. No explicit `writeAudit` is called from
 * this use-case — see the comment at the post-tx section for the
 * consolidation rationale.
 */
import "@/lib/core/init";
import type { ApplicationStatus, Role } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeToOutbox, processOutbox } from "@/lib/core/outbox";
import { Events } from "@/lib/core/event-types";
import { canAccessNodeReviewQueue } from "@/lib/permissions";

export type ApproveApplicationDecision = "APPROVE" | "REJECT";

export interface ApproveApplicationInput {
  /** ID of the user invoking the action; gated by canAccessNodeReviewQueue. */
  actorUserId: string;
  /** Active role of the actor. */
  actorRole: Role;
  /** Application to decide on. */
  applicationId: string;
  decision: ApproveApplicationDecision;
  /** Optional reviewer note; persisted to Application.notes and Review.notes. */
  reviewNote?: string;
  /** Optional propagation hint for tracing. */
  requestId?: string;
}

export type ApproveApplicationResult =
  | {
      ok: true;
      applicationId: string;
      newApplicationStatus: ApplicationStatus;
      previousApplicationStatus: ApplicationStatus;
    }
  | {
      ok: false;
      code: "FORBIDDEN" | "NOT_FOUND" | "APPLICATION_INVALID_TRANSITION";
      message: string;
      details?: Record<string, unknown>;
    };

/**
 * Allowed Application transitions. No formal SM exists yet — encoded here
 * as the authoritative matrix. Re-opening a terminal application is a
 * separate flow not handled by this use-case.
 */
const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  PENDING: ["REVIEWING", "APPROVED", "REJECTED"],
  REVIEWING: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

function targetStatus(decision: ApproveApplicationDecision): ApplicationStatus {
  return decision === "APPROVE" ? "APPROVED" : "REJECTED";
}

export async function approveApplication(
  input: ApproveApplicationInput,
): Promise<ApproveApplicationResult> {
  if (!canAccessNodeReviewQueue(input.actorRole)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Insufficient permissions to review applications.",
    };
  }

  const newStatus = targetStatus(input.decision);
  const prisma = getPrisma();

  type TxOk = {
    ok: true;
    applicationId: string;
    previousApplicationStatus: ApplicationStatus;
    newApplicationStatus: ApplicationStatus;
  };
  type TxErr = ApproveApplicationResult & { ok: false };

  const txResult: TxOk | TxErr = await prisma.$transaction(async (tx): Promise<TxOk | TxErr> => {
    const application = await tx.application.findUnique({
      where: { id: input.applicationId },
      select: { id: true, status: true },
    });
    if (!application) {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "Application not found.",
      };
    }

    const validNext = APPLICATION_TRANSITIONS[application.status] ?? [];
    if (!validNext.includes(newStatus)) {
      return {
        ok: false,
        code: "APPLICATION_INVALID_TRANSITION",
        message: `Cannot transition application from ${application.status} to ${newStatus}.`,
        details: {
          from: application.status,
          to: newStatus,
          validNext,
        },
      };
    }

    await tx.application.update({
      where: { id: input.applicationId },
      data: {
        status: newStatus,
        notes: input.reviewNote ?? null,
      },
    });

    await tx.review.create({
      data: {
        targetType: "APPLICATION",
        targetId: input.applicationId,
        decision: input.decision === "APPROVE" ? "APPROVE" : "REJECT",
        notes: input.reviewNote ?? null,
        status: "RESOLVED",
        reviewerId: input.actorUserId,
      },
    });

    const eventName =
      input.decision === "APPROVE"
        ? Events.APPLICATION_APPROVED
        : Events.APPLICATION_REJECTED;

    const basePayload = {
      applicationId: input.applicationId,
      // No FK from Application to Node in the schema — downstream handler
      // creates the Node when consuming APPLICATION_APPROVED.
      nodeId: null,
      previousStatus: application.status,
      reviewNote: input.reviewNote,
      entityType: "APPLICATION" as const,
      entityId: input.applicationId,
    };

    if (input.decision === "APPROVE") {
      await writeToOutbox(
        tx,
        eventName,
        { ...basePayload, approvedBy: input.actorUserId },
        { actorId: input.actorUserId, requestId: input.requestId },
      );
    } else {
      await writeToOutbox(
        tx,
        eventName,
        { ...basePayload, rejectedBy: input.actorUserId },
        { actorId: input.actorUserId, requestId: input.requestId },
      );
    }

    return {
      ok: true,
      applicationId: input.applicationId,
      previousApplicationStatus: application.status,
      newApplicationStatus: newStatus,
    };
  });

  if (!txResult.ok) {
    return txResult;
  }

  // Audit consolidation (resolves system-design doc §12 open question
  // #2 — "Audit row consolidation"). The explicit `writeAudit` is
  // intentionally absent: the outbox event written in-tx will fire
  // through the `eventBus.onAny` audit handler at
  // `lib/core/handlers/audit.ts` on dispatch, producing the canonical
  // audit row with action="application.approved" (or .rejected),
  // targetType="APPLICATION", targetId=input.applicationId.
  //
  // The pre-existing dual-write (explicit AuditAction.APPLICATION_STATUS_CHANGE
  // + onAny-derived "application.approved") was a hold-over from the
  // pre-outbox era. Reports filtering by the legacy uppercase action
  // label MUST be migrated — see PR description.

  void processOutbox(10).catch((err) => {
    console.error("[approve-application] post-commit dispatch failed", err);
  });

  return {
    ok: true,
    applicationId: txResult.applicationId,
    newApplicationStatus: txResult.newApplicationStatus,
    previousApplicationStatus: txResult.previousApplicationStatus,
  };
}
