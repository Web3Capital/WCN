import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { writeToOutbox, processOutbox } from "@/lib/core/outbox";
import type { writeAudit as realWriteAudit } from "@/lib/audit";

// ─── Hoisted mocks (vitest hoists `vi.mock` above imports; the mock
// implementations need to be available when the factory runs, so we use
// `vi.hoisted` to declare the mock fns alongside the mocks themselves.)

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
  AuditAction: { APPLICATION_STATUS_CHANGE: "APPLICATION_STATUS_CHANGE" },
  writeAudit: hoisted.mockWriteAudit,
}));

vi.mock("@/lib/core/init", () => ({}));

// In-memory fixture for the (small) Application surface this use-case
// touches. Mirrors the columns in `select` from the use-case.
interface ApplicationRow {
  id: string;
  status: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";
}

const applicationStore = new Map<string, ApplicationRow>();
const reviewCreates: Record<string, unknown>[] = [];

const mockTx = {
  application: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return applicationStore.get(where.id) ?? null;
    }),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status: ApplicationRow["status"]; notes?: string | null };
      }) => {
        const existing = applicationStore.get(where.id);
        if (!existing) throw new Error("not found");
        const next = { ...existing, status: data.status };
        applicationStore.set(where.id, next);
        return next;
      },
    ),
  },
  review: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      reviewCreates.push(data);
      return { id: `rev_${reviewCreates.length}`, ...data };
    }),
  },
};

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    $transaction: async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  }),
}));

import { approveApplication } from "../approve-application";

beforeEach(() => {
  applicationStore.clear();
  reviewCreates.length = 0;
  hoisted.mockOutboxWrite.mockReset();
  hoisted.mockOutboxWrite.mockResolvedValue("outbox_1");
  hoisted.mockProcessOutbox.mockReset();
  hoisted.mockProcessOutbox.mockResolvedValue(0);
  hoisted.mockWriteAudit.mockReset();
  hoisted.mockWriteAudit.mockResolvedValue(undefined);
  mockTx.application.findUnique.mockClear();
  mockTx.application.update.mockClear();
  mockTx.review.create.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("approveApplication — RBAC", () => {
  it("denies USER role", async () => {
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "USER",
      applicationId: "app_1",
      decision: "APPROVE",
    });
    expect(r).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: expect.stringContaining("permissions"),
    });
    expect(mockTx.application.findUnique).not.toHaveBeenCalled();
  });

  it("denies NODE_OWNER role", async () => {
    const r = await approveApplication({
      actorUserId: "u_no",
      actorRole: "NODE_OWNER",
      applicationId: "app_1",
      decision: "APPROVE",
    });
    expect(r.ok).toBe(false);
  });

  it("allows ADMIN role", async () => {
    applicationStore.set("app_1", { id: "app_1", status: "PENDING" });
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "ADMIN",
      applicationId: "app_1",
      decision: "APPROVE",
    });
    expect(r.ok).toBe(true);
  });

  it("allows REVIEWER role", async () => {
    applicationStore.set("app_2", { id: "app_2", status: "PENDING" });
    const r = await approveApplication({
      actorUserId: "u_rev",
      actorRole: "REVIEWER",
      applicationId: "app_2",
      decision: "APPROVE",
    });
    expect(r.ok).toBe(true);
  });

  it("allows RISK_DESK role", async () => {
    applicationStore.set("app_3", { id: "app_3", status: "PENDING" });
    const r = await approveApplication({
      actorUserId: "u_risk",
      actorRole: "RISK_DESK",
      applicationId: "app_3",
      decision: "APPROVE",
    });
    expect(r.ok).toBe(true);
  });
});

describe("approveApplication — lookups", () => {
  it("returns NOT_FOUND when application is missing", async () => {
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "ADMIN",
      applicationId: "missing",
      decision: "APPROVE",
    });
    expect(r).toEqual({
      ok: false,
      code: "NOT_FOUND",
      message: expect.any(String),
    });
  });
});

describe("approveApplication — Application transitions", () => {
  it("rejects transitions out of terminal APPROVED", async () => {
    applicationStore.set("app_t", { id: "app_t", status: "APPROVED" });
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "ADMIN",
      applicationId: "app_t",
      decision: "APPROVE",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("APPLICATION_INVALID_TRANSITION");
      expect(r.details?.from).toBe("APPROVED");
      expect(r.details?.validNext).toEqual([]);
    }
  });

  it("allows PENDING → APPROVED", async () => {
    applicationStore.set("app_p", { id: "app_p", status: "PENDING" });
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "ADMIN",
      applicationId: "app_p",
      decision: "APPROVE",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.newApplicationStatus).toBe("APPROVED");
  });

  it("allows REVIEWING → APPROVED", async () => {
    applicationStore.set("app_r", { id: "app_r", status: "REVIEWING" });
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "ADMIN",
      applicationId: "app_r",
      decision: "APPROVE",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.newApplicationStatus).toBe("APPROVED");
  });

  it("allows REVIEWING → REJECTED", async () => {
    applicationStore.set("app_x", { id: "app_x", status: "REVIEWING" });
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "REVIEWER",
      applicationId: "app_x",
      decision: "REJECT",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.newApplicationStatus).toBe("REJECTED");
  });
});

describe("approveApplication — orchestration on APPROVE", () => {
  beforeEach(() => {
    applicationStore.set("app_ok", { id: "app_ok", status: "REVIEWING" });
  });

  it("updates application + creates review + writes outbox event + dispatches (audit via onAny, not explicit)", async () => {
    const r = await approveApplication({
      actorUserId: "u_admin",
      actorRole: "ADMIN",
      applicationId: "app_ok",
      decision: "APPROVE",
      reviewNote: "Looks good.",
      requestId: "req_xyz",
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.newApplicationStatus).toBe("APPROVED");
    expect(r.previousApplicationStatus).toBe("REVIEWING");

    expect(mockTx.application.update).toHaveBeenCalledWith({
      where: { id: "app_ok" },
      data: { status: "APPROVED", notes: "Looks good." },
    });

    expect(reviewCreates).toHaveLength(1);
    expect(reviewCreates[0]).toMatchObject({
      targetType: "APPLICATION",
      targetId: "app_ok",
      decision: "APPROVE",
      status: "RESOLVED",
      reviewerId: "u_admin",
    });

    expect(hoisted.mockOutboxWrite).toHaveBeenCalledOnce();
    const [, eventName, payload, ctx] = hoisted.mockOutboxWrite.mock.calls[0];
    expect(eventName).toBe("application.approved");
    expect(payload).toMatchObject({
      applicationId: "app_ok",
      nodeId: null,
      previousStatus: "REVIEWING",
      approvedBy: "u_admin",
      entityType: "APPLICATION",
      entityId: "app_ok",
      reviewNote: "Looks good.",
    });
    expect(ctx).toEqual({ actorId: "u_admin", requestId: "req_xyz" });

    // Audit row is now written by the eventBus.onAny subscriber at
    // lib/core/handlers/audit.ts when processOutbox dispatches the
    // event — NOT by an explicit writeAudit from this use-case. The
    // payload above carries entityType/entityId so the audit row
    // resolves correctly on the receiving side.
    expect(hoisted.mockWriteAudit).not.toHaveBeenCalled();

    expect(hoisted.mockProcessOutbox).toHaveBeenCalledOnce();
  });
});

describe("approveApplication — orchestration on REJECT", () => {
  it("emits application.rejected with rejectedBy and creates a REJECT review", async () => {
    applicationStore.set("app_rej", { id: "app_rej", status: "REVIEWING" });

    const r = await approveApplication({
      actorUserId: "u_rev",
      actorRole: "REVIEWER",
      applicationId: "app_rej",
      decision: "REJECT",
      reviewNote: "Insufficient KYC.",
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.newApplicationStatus).toBe("REJECTED");

    expect(hoisted.mockOutboxWrite).toHaveBeenCalledOnce();
    const [, eventName, payload] = hoisted.mockOutboxWrite.mock.calls[0];
    expect(eventName).toBe("application.rejected");
    expect(payload).toMatchObject({
      applicationId: "app_rej",
      nodeId: null,
      rejectedBy: "u_rev",
      previousStatus: "REVIEWING",
      reviewNote: "Insufficient KYC.",
      entityType: "APPLICATION",
      entityId: "app_rej",
    });
    expect(reviewCreates[0]).toMatchObject({ decision: "REJECT" });
  });

  it("does not call processOutbox when transaction errored out (NOT_FOUND)", async () => {
    const r = await approveApplication({
      actorUserId: "u1",
      actorRole: "ADMIN",
      applicationId: "ghost",
      decision: "REJECT",
    });
    expect(r.ok).toBe(false);
    expect(hoisted.mockProcessOutbox).not.toHaveBeenCalled();
    expect(hoisted.mockWriteAudit).not.toHaveBeenCalled();
  });
});
