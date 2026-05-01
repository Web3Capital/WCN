import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { writeToOutbox, processOutbox } from "@/lib/core/outbox";
import type { writeAudit as realWriteAudit } from "@/lib/audit";

const hoisted = vi.hoisted(() => {
  return {
    mockOutboxWrite: vi.fn() as MockedFunction<typeof writeToOutbox>,
    mockProcessOutbox: vi.fn() as MockedFunction<typeof processOutbox>,
    mockWriteAudit: vi.fn() as MockedFunction<typeof realWriteAudit>,
  };
});

vi.mock("@/lib/core/outbox", () => ({
  writeToOutbox: hoisted.mockOutboxWrite,
  processOutbox: hoisted.mockProcessOutbox,
}));

vi.mock("@/lib/audit", () => ({
  AuditAction: {
    SETTLEMENT_CYCLE_LOCK: "SETTLEMENT_CYCLE_LOCK",
    SETTLEMENT_LOCK_APPROVAL: "SETTLEMENT_LOCK_APPROVAL",
  },
  writeAudit: hoisted.mockWriteAudit,
}));

vi.mock("@/lib/core/init", () => ({}));

interface CycleRow {
  id: string;
  status:
    | "DRAFT"
    | "RECONCILED"
    | "LOCK_PENDING_APPROVAL"
    | "LOCKED"
    | "EXPORTED"
    | "REOPEN_PENDING_APPROVAL"
    | "REOPENED"
    | "FINALIZED";
  workspaceId: string | null;
  lockApprovalId?: string | null;
  lockedById?: string | null;
}

const cycleStore = new Map<string, CycleRow>();
const approvalCreates: Record<string, unknown>[] = [];

const mockTx = {
  settlementCycle: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return cycleStore.get(where.id) ?? null;
    }),
    update: vi.fn(
      async ({ where, data }: { where: { id: string }; data: Partial<CycleRow> }) => {
        const row = cycleStore.get(where.id);
        if (!row) throw new Error("not found");
        const next: CycleRow = { ...row, ...data };
        cycleStore.set(where.id, next);
        return next;
      },
    ),
  },
  approvalAction: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const id = `appr_${approvalCreates.length + 1}`;
      approvalCreates.push({ id, ...data });
      return { id, ...data };
    }),
  },
};

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    $transaction: async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  }),
}));

import { lockSettlementCycle } from "../lock-settlement-cycle";

beforeEach(() => {
  cycleStore.clear();
  approvalCreates.length = 0;
  hoisted.mockOutboxWrite.mockReset();
  hoisted.mockOutboxWrite.mockResolvedValue("outbox_1");
  hoisted.mockProcessOutbox.mockReset();
  hoisted.mockProcessOutbox.mockResolvedValue(0);
  hoisted.mockWriteAudit.mockReset();
  hoisted.mockWriteAudit.mockResolvedValue(undefined);
  mockTx.settlementCycle.findUnique.mockClear();
  mockTx.settlementCycle.update.mockClear();
  mockTx.approvalAction.create.mockClear();
});

afterEach(() => vi.clearAllMocks());

function seedCycle(row: Omit<CycleRow, "lockApprovalId" | "lockedById"> & Partial<Pick<CycleRow, "lockApprovalId" | "lockedById">>): void {
  cycleStore.set(row.id, {
    lockApprovalId: null,
    lockedById: null,
    ...row,
  });
}

describe("lockSettlementCycle — RBAC", () => {
  it("denies USER role", async () => {
    const r = await lockSettlementCycle({
      actorUserId: "u1",
      actorRole: "USER",
      cycleId: "c1",
      mode: "direct",
    });
    expect(r).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: expect.stringContaining("permissions"),
    });
    expect(mockTx.settlementCycle.findUnique).not.toHaveBeenCalled();
  });

  it("denies NODE_OWNER role", async () => {
    const r = await lockSettlementCycle({
      actorUserId: "u_no",
      actorRole: "NODE_OWNER",
      cycleId: "c1",
      mode: "direct",
    });
    expect(r.ok).toBe(false);
  });

  it("allows ADMIN role", async () => {
    seedCycle({ id: "c1", status: "RECONCILED", workspaceId: "ws_1" });
    const r = await lockSettlementCycle({
      actorUserId: "u_admin",
      actorRole: "ADMIN",
      cycleId: "c1",
      mode: "direct",
    });
    expect(r.ok).toBe(true);
  });

  it("allows FINANCE_ADMIN role", async () => {
    seedCycle({ id: "c2", status: "RECONCILED", workspaceId: "ws_1" });
    const r = await lockSettlementCycle({
      actorUserId: "u_fin",
      actorRole: "FINANCE_ADMIN",
      cycleId: "c2",
      mode: "direct",
    });
    expect(r.ok).toBe(true);
  });
});

describe("lockSettlementCycle — lookups", () => {
  it("returns NOT_FOUND when cycle is missing", async () => {
    const r = await lockSettlementCycle({
      actorUserId: "u1",
      actorRole: "ADMIN",
      cycleId: "missing",
      mode: "direct",
    });
    expect(r).toEqual({
      ok: false,
      code: "NOT_FOUND",
      message: expect.any(String),
    });
  });
});

describe("lockSettlementCycle — idempotency", () => {
  it.each(["LOCKED", "EXPORTED", "FINALIZED"] as const)(
    "returns idempotent success when status is %s",
    async (status) => {
      seedCycle({ id: "c_idem", status, workspaceId: "ws_1" });
      const r = await lockSettlementCycle({
        actorUserId: "u1",
        actorRole: "ADMIN",
        cycleId: "c_idem",
        mode: "direct",
      });
      expect(r).toMatchObject({
        ok: true,
        idempotent: true,
        cycleId: "c_idem",
        currentStatus: status,
      });
      expect(mockTx.settlementCycle.update).not.toHaveBeenCalled();
      expect(hoisted.mockOutboxWrite).not.toHaveBeenCalled();
      expect(hoisted.mockWriteAudit).not.toHaveBeenCalled();
    },
  );
});

describe("lockSettlementCycle — SM validation", () => {
  it("rejects DRAFT → LOCKED (must reconcile first)", async () => {
    seedCycle({ id: "c_d", status: "DRAFT", workspaceId: "ws_1" });
    const r = await lockSettlementCycle({
      actorUserId: "u1",
      actorRole: "ADMIN",
      cycleId: "c_d",
      mode: "direct",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("SETTLEMENT_INVALID_STATE");
      expect(r.details).toEqual({ from: "DRAFT", to: "LOCKED", mode: "direct" });
    }
  });

  it("rejects DRAFT → LOCK_PENDING_APPROVAL (request mode)", async () => {
    seedCycle({ id: "c_d2", status: "DRAFT", workspaceId: "ws_1" });
    const r = await lockSettlementCycle({
      actorUserId: "u1",
      actorRole: "ADMIN",
      cycleId: "c_d2",
      mode: "request",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("SETTLEMENT_INVALID_STATE");
  });
});

describe("lockSettlementCycle — direct mode", () => {
  beforeEach(() => {
    seedCycle({ id: "c_ok", status: "RECONCILED", workspaceId: "ws_1" });
  });

  it("transitions RECONCILED → LOCKED, writes outbox + audit + dispatches", async () => {
    const r = await lockSettlementCycle({
      actorUserId: "u_admin",
      actorRole: "FINANCE_ADMIN",
      cycleId: "c_ok",
      mode: "direct",
      requestId: "req_xyz",
    });

    expect(r.ok).toBe(true);
    if (!r.ok || r.idempotent) return;
    expect(r.previousStatus).toBe("RECONCILED");
    expect(r.newStatus).toBe("LOCKED");
    expect(r.approvalId).toBeUndefined();

    expect(mockTx.settlementCycle.update).toHaveBeenCalledWith({
      where: { id: "c_ok" },
      data: { status: "LOCKED", lockedById: "u_admin" },
    });
    expect(approvalCreates).toHaveLength(0);

    // Outbox emits settlement.approved
    expect(hoisted.mockOutboxWrite).toHaveBeenCalledOnce();
    const [, eventName, payload, ctx] = hoisted.mockOutboxWrite.mock.calls[0];
    expect(eventName).toBe("settlement.approved");
    expect(payload).toMatchObject({ cycleId: "c_ok", approvedBy: "u_admin" });
    expect(ctx).toEqual({ actorId: "u_admin", requestId: "req_xyz" });

    // Audit comes from the onAny subscriber on event dispatch, not from
    // an explicit writeAudit in this use-case. The settlement.approved
    // payload carries entityType / entityId so the audit row resolves
    // to ("SETTLEMENT_CYCLE", "c_ok") on the receiving side.
    expect(hoisted.mockWriteAudit).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      cycleId: "c_ok",
      entityType: "SETTLEMENT_CYCLE",
      entityId: "c_ok",
    });

    expect(hoisted.mockProcessOutbox).toHaveBeenCalledOnce();
  });

  it("works without a workspaceId on the cycle (direct mode is workspace-agnostic)", async () => {
    seedCycle({ id: "c_no_ws", status: "RECONCILED", workspaceId: null });
    const r = await lockSettlementCycle({
      actorUserId: "u_admin",
      actorRole: "ADMIN",
      cycleId: "c_no_ws",
      mode: "direct",
    });
    expect(r.ok).toBe(true);
    if (r.ok && !r.idempotent) expect(r.newStatus).toBe("LOCKED");
  });
});

describe("lockSettlementCycle — request mode (dual control)", () => {
  beforeEach(() => {
    seedCycle({ id: "c_req", status: "RECONCILED", workspaceId: "ws_1" });
  });

  it("transitions RECONCILED → LOCK_PENDING_APPROVAL, creates ApprovalAction, writes outbox + audit", async () => {
    const r = await lockSettlementCycle({
      actorUserId: "u_fin",
      actorRole: "FINANCE_ADMIN",
      cycleId: "c_req",
      mode: "request",
      reason: "Quarter close — second-pair-of-eyes required.",
      requestId: "req_abc",
    });

    expect(r.ok).toBe(true);
    if (!r.ok || r.idempotent) return;
    expect(r.previousStatus).toBe("RECONCILED");
    expect(r.newStatus).toBe("LOCK_PENDING_APPROVAL");
    expect(r.approvalId).toMatch(/^appr_/);

    // ApprovalAction created with the reason and pointing at the cycle
    expect(approvalCreates).toHaveLength(1);
    expect(approvalCreates[0]).toMatchObject({
      workspaceId: "ws_1",
      entityType: "SETTLEMENT_CYCLE",
      entityId: "c_req",
      actionType: "LOCK",
      requestedById: "u_fin",
      reason: "Quarter close — second-pair-of-eyes required.",
    });

    // Cycle updated with lockApprovalId pointing at the new approval
    expect(mockTx.settlementCycle.update).toHaveBeenCalledWith({
      where: { id: "c_req" },
      data: { status: "LOCK_PENDING_APPROVAL", lockApprovalId: r.approvalId },
    });

    // Outbox: approval.requested
    const [, eventName, payload] = hoisted.mockOutboxWrite.mock.calls[0];
    expect(eventName).toBe("approval.requested");
    expect(payload).toMatchObject({
      action: "LOCK",
      entityType: "SETTLEMENT_CYCLE",
      entityId: "c_req",
      requestedBy: "u_fin",
    });

    // Audit handled by onAny on dispatch; no explicit writeAudit.
    expect(hoisted.mockWriteAudit).not.toHaveBeenCalled();
  });

  it("rejects request mode when cycle has no workspace (no silent empty-string write)", async () => {
    seedCycle({ id: "c_no_ws", status: "RECONCILED", workspaceId: null });
    const r = await lockSettlementCycle({
      actorUserId: "u_fin",
      actorRole: "FINANCE_ADMIN",
      cycleId: "c_no_ws",
      mode: "request",
    });
    expect(r).toEqual({
      ok: false,
      code: "WORKSPACE_REQUIRED",
      message: expect.stringContaining("workspace"),
    });
    expect(approvalCreates).toHaveLength(0);
    expect(hoisted.mockOutboxWrite).not.toHaveBeenCalled();
  });
});
