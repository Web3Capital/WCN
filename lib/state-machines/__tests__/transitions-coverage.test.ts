/**
 * Exhaustive transition-matrix coverage for all 9 state machines.
 *
 * Existing tests (e.g. settlement.test.ts) are spot-checks for human
 * readability. This file is the **regression ratchet** — it mirrors the
 * full transition matrix from `lib/core/state-machine.ts` and verifies:
 *
 *   1. Every (from, to) pair listed in the matrix returns canTransition=true
 *   2. Every (from, to) pair NOT listed (including self-loops) returns false
 *   3. validNext returns exactly the matrix entry (set equality)
 *   4. Terminal states (validNext = []) cannot transition anywhere
 *
 * The matrix is intentionally duplicated here. Any change to the source
 * matrix in lib/core/state-machine.ts MUST be reflected in this file —
 * that's the regression protection. Financial-grade SMs (Settlement,
 * PoB, Evidence, Node) cannot silently widen or narrow.
 *
 * Test count: ~225 (3 cases × ~75 from-states across 9 SMs).
 */
import { describe, it, expect } from "vitest";
import type {
  AccountStatus,
  ProjectStatus,
  DealStage,
  NodeStatus,
  TaskStatus,
  EvidenceReviewStatus,
  PoBEventStatus,
  SettlementCycleStatus,
  PolicyStatus,
} from "@prisma/client";
import {
  canTransitionAccount,
  validNextAccountStatuses,
  canTransitionProject,
  validNextProjectStatuses,
  canTransitionDeal,
  validNextDealStages,
  canTransitionNode,
  validNextNodeStatuses,
  canTransitionTask,
  validNextTaskStatuses,
  canTransitionEvidence,
  validNextEvidenceStatuses,
  canTransitionPoB,
  validNextPoBStatuses,
  canTransitionSettlement,
  validNextSettlementStatuses,
  canTransitionPolicy,
  validNextPolicyStatuses,
} from "@/lib/core/state-machine";

// ─── Mirror of the source-of-truth transition matrix ──────────────────
// Keep aligned with `lib/core/state-machine.ts`. When that file changes,
// this one fails first — that is the design.

const ACCOUNT_MATRIX: Record<AccountStatus, AccountStatus[]> = {
  INVITED: ["ACTIVE", "PENDING_2FA", "OFFBOARDED"],
  ACTIVE: ["SUSPENDED", "LOCKED", "OFFBOARDED"],
  PENDING_2FA: ["ACTIVE", "SUSPENDED", "OFFBOARDED"],
  SUSPENDED: ["ACTIVE", "LOCKED", "OFFBOARDED"],
  LOCKED: ["ACTIVE", "SUSPENDED", "OFFBOARDED"],
  OFFBOARDED: [],
};

const PROJECT_MATRIX: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["SCREENED", "REJECTED"],
  SCREENED: ["CURATED", "REJECTED"],
  CURATED: ["IN_DEAL_ROOM", "ON_HOLD"],
  IN_DEAL_ROOM: ["ACTIVE", "ON_HOLD"],
  ACTIVE: ["APPROVED", "ON_HOLD", "ARCHIVED"],
  ON_HOLD: ["CURATED", "ACTIVE"],
  APPROVED: ["ARCHIVED"],
  REJECTED: ["DRAFT"],
  ARCHIVED: [],
};

const DEAL_MATRIX: Record<DealStage, DealStage[]> = {
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
};

const NODE_MATRIX: Record<NodeStatus, NodeStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["NEED_MORE_INFO", "APPROVED", "REJECTED"],
  NEED_MORE_INFO: ["UNDER_REVIEW", "REJECTED"],
  APPROVED: ["CONTRACTING", "REJECTED"],
  REJECTED: [],
  CONTRACTING: ["LIVE", "PROBATION", "SUSPENDED"],
  LIVE: ["PROBATION", "WATCHLIST", "SUSPENDED", "OFFBOARDED"],
  WATCHLIST: ["LIVE", "SUSPENDED", "OFFBOARDED"],
  PROBATION: ["LIVE", "WATCHLIST", "SUSPENDED", "OFFBOARDED"],
  SUSPENDED: ["LIVE", "OFFBOARDED"],
  OFFBOARDED: [],
  ACTIVE: ["PROBATION", "WATCHLIST", "SUSPENDED", "OFFBOARDED", "LIVE"], // legacy alias
};

const TASK_MATRIX: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED", "BLOCKED", "CANCELLED"],
  SUBMITTED: ["ACCEPTED", "REWORK"],
  ACCEPTED: ["CLOSED"],
  REWORK: ["IN_PROGRESS", "CANCELLED"],
  BLOCKED: ["IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
  CLOSED: [],
  OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"], // legacy
  WAITING_REVIEW: ["SUBMITTED", "ACCEPTED", "REWORK"],
  DONE: ["CLOSED"],
};

const EVIDENCE_MATRIX: Record<EvidenceReviewStatus, EvidenceReviewStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "DISPUTED"],
  APPROVED: [],
  REJECTED: ["SUBMITTED"],
  DISPUTED: ["UNDER_REVIEW", "REJECTED"],
};

const POB_MATRIX: Record<PoBEventStatus, PoBEventStatus[]> = {
  CREATED: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["EFFECTIVE", "REJECTED", "FROZEN"],
  EFFECTIVE: ["FROZEN"],
  REJECTED: ["PENDING_REVIEW"],
  FROZEN: ["PENDING_REVIEW", "REJECTED"],
};

const SETTLEMENT_MATRIX: Record<SettlementCycleStatus, SettlementCycleStatus[]> = {
  DRAFT: ["RECONCILED"],
  RECONCILED: ["LOCK_PENDING_APPROVAL", "LOCKED", "DRAFT"],
  LOCK_PENDING_APPROVAL: ["LOCKED", "RECONCILED"],
  LOCKED: ["EXPORTED", "REOPEN_PENDING_APPROVAL", "REOPENED", "FINALIZED"],
  EXPORTED: ["FINALIZED", "REOPEN_PENDING_APPROVAL", "REOPENED"],
  REOPEN_PENDING_APPROVAL: ["REOPENED", "LOCKED", "EXPORTED"],
  REOPENED: ["RECONCILED"],
  FINALIZED: [],
};

const POLICY_MATRIX: Record<PolicyStatus, PolicyStatus[]> = {
  DRAFT: ["ACTIVE", "RETIRED"],
  ACTIVE: ["SUSPENDED", "RETIRED"],
  SUSPENDED: ["ACTIVE", "RETIRED"],
  RETIRED: [],
};

// ─── Generic harness ──────────────────────────────────────────────────

interface SmCheck<S extends string> {
  name: string;
  matrix: Record<S, S[]>;
  canTransition: (from: S, to: S) => boolean;
  validNext: (from: S) => S[];
}

function exhaustiveCoverage<S extends string>(check: SmCheck<S>): void {
  const allStatuses = Object.keys(check.matrix) as S[];

  describe(`${check.name} SM transition coverage`, () => {
    for (const from of allStatuses) {
      const allowed = check.matrix[from];
      const denied = allStatuses.filter((s) => !allowed.includes(s));

      describe(`from ${from}`, () => {
        it(`canTransition is true for the listed targets [${allowed.join(", ") || "(none)"}]`, () => {
          for (const to of allowed) {
            expect(check.canTransition(from, to)).toBe(true);
          }
        });

        it("canTransition is false for every unlisted target (incl. self when self isn't allowed)", () => {
          for (const to of denied) {
            expect(check.canTransition(from, to)).toBe(false);
          }
        });

        it("validNext returns exactly the matrix entry", () => {
          expect([...check.validNext(from)].sort()).toEqual([...allowed].sort());
        });
      });
    }

    it("terminal states have no outgoing transitions", () => {
      for (const from of allStatuses) {
        const allowed = check.matrix[from];
        if (allowed.length === 0) {
          expect(check.validNext(from)).toEqual([]);
          for (const to of allStatuses) {
            expect(check.canTransition(from, to)).toBe(false);
          }
        }
      }
    });
  });
}

// ─── Apply harness to all 9 SMs ───────────────────────────────────────

exhaustiveCoverage<AccountStatus>({
  name: "Account",
  matrix: ACCOUNT_MATRIX,
  canTransition: canTransitionAccount,
  validNext: validNextAccountStatuses,
});

exhaustiveCoverage<ProjectStatus>({
  name: "Project",
  matrix: PROJECT_MATRIX,
  canTransition: canTransitionProject,
  validNext: validNextProjectStatuses,
});

exhaustiveCoverage<DealStage>({
  name: "Deal",
  matrix: DEAL_MATRIX,
  canTransition: canTransitionDeal,
  validNext: validNextDealStages,
});

exhaustiveCoverage<NodeStatus>({
  name: "Node",
  matrix: NODE_MATRIX,
  canTransition: canTransitionNode,
  validNext: validNextNodeStatuses,
});

exhaustiveCoverage<TaskStatus>({
  name: "Task",
  matrix: TASK_MATRIX,
  canTransition: canTransitionTask,
  validNext: validNextTaskStatuses,
});

exhaustiveCoverage<EvidenceReviewStatus>({
  name: "Evidence",
  matrix: EVIDENCE_MATRIX,
  canTransition: canTransitionEvidence,
  validNext: validNextEvidenceStatuses,
});

exhaustiveCoverage<PoBEventStatus>({
  name: "PoB",
  matrix: POB_MATRIX,
  canTransition: canTransitionPoB,
  validNext: validNextPoBStatuses,
});

exhaustiveCoverage<SettlementCycleStatus>({
  name: "Settlement",
  matrix: SETTLEMENT_MATRIX,
  canTransition: canTransitionSettlement,
  validNext: validNextSettlementStatuses,
});

exhaustiveCoverage<PolicyStatus>({
  name: "Policy",
  matrix: POLICY_MATRIX,
  canTransition: canTransitionPolicy,
  validNext: validNextPolicyStatuses,
});

// ─── Cross-SM invariants ──────────────────────────────────────────────

describe("Cross-SM invariants", () => {
  const allMatrices: { name: string; matrix: Record<string, string[]> }[] = [
    { name: "Account", matrix: ACCOUNT_MATRIX },
    { name: "Project", matrix: PROJECT_MATRIX },
    { name: "Deal", matrix: DEAL_MATRIX },
    { name: "Node", matrix: NODE_MATRIX },
    { name: "Task", matrix: TASK_MATRIX },
    { name: "Evidence", matrix: EVIDENCE_MATRIX },
    { name: "PoB", matrix: POB_MATRIX },
    { name: "Settlement", matrix: SETTLEMENT_MATRIX },
    { name: "Policy", matrix: POLICY_MATRIX },
  ];

  it("every transition target appears as a matrix key (no orphan targets)", () => {
    for (const { name, matrix } of allMatrices) {
      const keys = new Set(Object.keys(matrix));
      for (const [from, targets] of Object.entries(matrix)) {
        for (const to of targets) {
          if (!keys.has(to)) {
            throw new Error(`${name}: transition ${from} → ${to} targets unknown status`);
          }
        }
      }
    }
  });

  it("every SM except PoB has at least one terminal state", () => {
    // PoB is intentionally "always re-reviewable" by design — there is no
    // permanent end state. Every other SM has at least one terminal status
    // (OFFBOARDED, ARCHIVED, FUNDED+PASSED, REJECTED+OFFBOARDED, CANCELLED+
    // CLOSED, APPROVED, FINALIZED, RETIRED). If a future SM is added without
    // a terminal, this assertion will catch it and force a deliberate
    // PoB-style exception or an actual fix.
    for (const { name, matrix } of allMatrices) {
      if (name === "PoB") continue;
      const terminals = Object.entries(matrix).filter(([, allowed]) => allowed.length === 0);
      expect(terminals.length, `${name} has no terminal state`).toBeGreaterThan(0);
    }
  });

  it("PoB SM remains terminal-free (documented exception — change requires PM signoff)", () => {
    // This guards against silent introduction of a terminal in PoB without
    // updating the cross-SM invariant above. Flip both together.
    const terminals = Object.entries(POB_MATRIX).filter(([, allowed]) => allowed.length === 0);
    expect(terminals.length).toBe(0);
  });

  it("every SM has at least one initial-style state (no self-loops only)", () => {
    for (const { name, matrix } of allMatrices) {
      const hasOutgoing = Object.values(matrix).some((targets) => targets.length > 0);
      expect(hasOutgoing, `${name} has no outgoing transitions at all`).toBe(true);
    }
  });
});
