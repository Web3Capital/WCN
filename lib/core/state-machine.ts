/**
 * Generic State Machine Framework
 *
 * Wraps the existing per-entity state machines with a unified interface
 * that enforces transitions and emits events on state change.
 */

import { eventBus } from "./event-bus";

export interface StateMachineConfig<S extends string> {
  transitions: Record<S, S[]>;
  entityType: string;
  eventName: string;
}

export class StateMachine<S extends string> {
  constructor(private config: StateMachineConfig<S>) {}

  canTransition(from: S, to: S): boolean {
    return this.config.transitions[from]?.includes(to) ?? false;
  }

  validNext(from: S): S[] {
    return this.config.transitions[from] ?? [];
  }

  isTerminal(status: S): boolean {
    return (this.config.transitions[status] ?? []).length === 0;
  }

  /**
   * Validate a transition and emit an event if valid.
   * Throws if the transition is not allowed.
   */
  async transition(
    entityId: string,
    from: S,
    to: S,
    context?: { actorId?: string; requestId?: string },
  ): Promise<void> {
    if (!this.canTransition(from, to)) {
      const valid = this.validNext(from);
      throw new TransitionError(
        this.config.entityType,
        from,
        to,
        valid,
      );
    }

    await eventBus.emit(
      this.config.eventName,
      {
        entityId,
        entityType: this.config.entityType,
        oldStatus: from,
        newStatus: to,
      },
      context,
    );
  }
}

export class TransitionError extends Error {
  public readonly code: string;
  public readonly entityType: string;
  public readonly from: string;
  public readonly to: string;
  public readonly validTransitions: string[];

  constructor(entityType: string, from: string, to: string, validTransitions: string[]) {
    super(
      `Cannot transition ${entityType} from ${from} to ${to}. Valid: [${validTransitions.join(", ")}]`,
    );
    this.name = "TransitionError";
    this.code = `${entityType.toUpperCase()}_INVALID_TRANSITION`;
    this.entityType = entityType;
    this.from = from;
    this.to = to;
    this.validTransitions = validTransitions;
  }
}

// ─── Pre-configured State Machines ──────────────────────────────
// These import the existing transition maps and wrap them.

import type {
  AccountStatus,
  DealStage,
  NodeStatus,
  TaskStatus,
  EvidenceReviewStatus,
  PoBEventStatus,
  SettlementCycleStatus,
} from "@prisma/client";

export const AccountMachine = new StateMachine<AccountStatus>({
  transitions: {
    INVITED: ["ACTIVE", "PENDING_2FA", "OFFBOARDED"],
    ACTIVE: ["SUSPENDED", "LOCKED", "OFFBOARDED"],
    PENDING_2FA: ["ACTIVE", "SUSPENDED", "OFFBOARDED"],
    SUSPENDED: ["ACTIVE", "LOCKED", "OFFBOARDED"],
    LOCKED: ["ACTIVE", "SUSPENDED", "OFFBOARDED"],
    OFFBOARDED: [],
  },
  entityType: "Account",
  eventName: "user.status_changed",
});

export const DealMachine = new StateMachine<DealStage>({
  transitions: {
    SOURCED: ["MATCHED", "PASSED"],
    MATCHED: ["INTRO_SENT", "PASSED"],
    INTRO_SENT: ["MEETING_DONE", "PASSED"],
    MEETING_DONE: ["DD", "PASSED", "PAUSED"],
    DD: ["TERM_SHEET", "PASSED", "PAUSED"],
    TERM_SHEET: ["SIGNED", "PASSED", "PAUSED"],
    SIGNED: ["FUNDED", "PASSED", "PAUSED"],
    FUNDED: [],
    PASSED: [],
    PAUSED: ["DD", "TERM_SHEET", "SIGNED", "PASSED"],
  },
  entityType: "Deal",
  eventName: "deal.stage_changed",
});

export const NodeMachine = new StateMachine<NodeStatus>({
  transitions: {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
    UNDER_REVIEW: ["NEED_MORE_INFO", "APPROVED", "REJECTED"],
    NEED_MORE_INFO: ["UNDER_REVIEW", "REJECTED"],
    APPROVED: ["CONTRACTING", "REJECTED"],
    REJECTED: [],
    CONTRACTING: ["LIVE", "SUSPENDED"],
    LIVE: ["PROBATION", "SUSPENDED", "OFFBOARDED"],
    PROBATION: ["LIVE", "SUSPENDED", "OFFBOARDED"],
    SUSPENDED: ["LIVE", "OFFBOARDED"],
    OFFBOARDED: [],
    ACTIVE: ["PROBATION", "SUSPENDED", "OFFBOARDED"],
  },
  entityType: "Node",
  eventName: "node.status_changed",
});

export const TaskMachine = new StateMachine<TaskStatus>({
  transitions: {
    DRAFT: ["ASSIGNED", "CANCELLED"],
    ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["SUBMITTED", "BLOCKED", "CANCELLED"],
    SUBMITTED: ["ACCEPTED", "REWORK"],
    ACCEPTED: ["CLOSED"],
    REWORK: ["IN_PROGRESS", "CANCELLED"],
    BLOCKED: ["IN_PROGRESS", "CANCELLED"],
    CANCELLED: [],
    CLOSED: [],
    OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
    WAITING_REVIEW: ["SUBMITTED", "ACCEPTED", "REWORK"],
    DONE: ["CLOSED"],
  },
  entityType: "Task",
  eventName: "task.status_changed",
});

export const EvidenceMachine = new StateMachine<EvidenceReviewStatus>({
  transitions: {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["APPROVED", "REJECTED", "DISPUTED"],
    APPROVED: [],
    REJECTED: ["SUBMITTED"],
    DISPUTED: ["UNDER_REVIEW", "REJECTED"],
  },
  entityType: "Evidence",
  eventName: "evidence.status_changed",
});

export const PoBMachine = new StateMachine<PoBEventStatus>({
  transitions: {
    CREATED: ["PENDING_REVIEW"],
    PENDING_REVIEW: ["EFFECTIVE", "REJECTED", "FROZEN"],
    EFFECTIVE: ["FROZEN"],
    REJECTED: ["PENDING_REVIEW"],
    FROZEN: ["PENDING_REVIEW", "REJECTED"],
  },
  entityType: "PoB",
  eventName: "pob.status_changed",
});

export const SettlementMachine = new StateMachine<SettlementCycleStatus>({
  transitions: {
    DRAFT: ["RECONCILED"],
    RECONCILED: ["LOCK_PENDING_APPROVAL", "LOCKED", "DRAFT"],
    LOCK_PENDING_APPROVAL: ["LOCKED", "RECONCILED"],
    LOCKED: ["EXPORTED", "REOPEN_PENDING_APPROVAL", "REOPENED", "FINALIZED"],
    EXPORTED: ["FINALIZED", "REOPEN_PENDING_APPROVAL", "REOPENED"],
    REOPEN_PENDING_APPROVAL: ["REOPENED", "LOCKED", "EXPORTED"],
    REOPENED: ["RECONCILED"],
    FINALIZED: [],
  },
  entityType: "Settlement",
  eventName: "settlement.status_changed",
});
