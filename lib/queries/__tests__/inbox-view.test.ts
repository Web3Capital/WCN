import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { buildInboxView } from "../inbox-view";

interface AppRow {
  id: string;
  applicantName: string;
  organization: string | null;
  status: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  workspaceId?: string | null;
}
interface ApprovalRow {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  actionType: "LOCK" | "REOPEN";
  entityType: string;
  entityId: string;
  requestedById: string;
  reason: string | null;
  createdAt: Date;
  workspaceId?: string | null;
}
interface CycleRow {
  id: string;
  kind: "WEEK" | "MONTH";
  startAt: Date;
  endAt: Date;
  status: string;
}
interface DisputeRow {
  id: string;
  targetType: "NODE" | "PROJECT";
  targetId: string;
  reason: string;
  status: "OPEN" | "RESOLVED";
  createdAt: Date;
  workspaceId?: string | null;
}

function mkPrisma(seed: {
  applications?: AppRow[];
  approvals?: ApprovalRow[];
  cycles?: CycleRow[];
  disputes?: DisputeRow[];
}): PrismaClient {
  const apps = seed.applications ?? [];
  const approvals = seed.approvals ?? [];
  const cycles = seed.cycles ?? [];
  const disputes = seed.disputes ?? [];

  const prisma = {
    application: {
      findMany: vi.fn(async ({ where, take }: { where: { status: { in: string[] }; workspaceId?: string }; take?: number }) => {
        let rows = apps.filter((a) => where.status.in.includes(a.status));
        if (where.workspaceId !== undefined) {
          rows = rows.filter((a) => a.workspaceId === where.workspaceId);
        }
        rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return take ? rows.slice(0, take) : rows;
      }),
    },
    approvalAction: {
      findMany: vi.fn(
        async ({
          where,
          take,
        }: {
          where: {
            status: string;
            actionType: string;
            entityType: string;
            requestedById: { not: string };
            workspaceId?: string;
          };
          take?: number;
        }) => {
          let rows = approvals.filter(
            (a) =>
              a.status === where.status &&
              a.actionType === where.actionType &&
              a.entityType === where.entityType &&
              a.requestedById !== where.requestedById.not,
          );
          if (where.workspaceId !== undefined) {
            rows = rows.filter((a) => a.workspaceId === where.workspaceId);
          }
          rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return take ? rows.slice(0, take) : rows;
        },
      ),
    },
    settlementCycle: {
      findMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        return cycles.filter((c) => where.id.in.includes(c.id));
      }),
    },
    dispute: {
      findMany: vi.fn(
        async ({
          where,
          take,
        }: {
          where: { status: string; workspaceId?: string };
          take?: number;
        }) => {
          let rows = disputes.filter((d) => d.status === where.status);
          if (where.workspaceId !== undefined) {
            rows = rows.filter((d) => d.workspaceId === where.workspaceId);
          }
          rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return take ? rows.slice(0, take) : rows;
        },
      ),
    },
  };
  return prisma as unknown as PrismaClient;
}

const NOW = new Date("2026-05-02T12:00:00Z");
const ago = (mins: number) => new Date(NOW.getTime() - mins * 60_000);

describe("buildInboxView — RBAC gating", () => {
  it("returns empty for USER role (no review/finance permissions)", async () => {
    const prisma = mkPrisma({
      applications: [
        { id: "a1", applicantName: "Alice", organization: "ACME", status: "PENDING", createdAt: ago(30) },
      ],
      disputes: [
        { id: "d1", targetType: "NODE", targetId: "n1", reason: "bad", status: "OPEN", createdAt: ago(60) },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "USER", now: NOW });
    expect(view.items).toEqual([]);
    expect(view.totalCount).toBe(0);
  });

  it("REVIEWER sees applications + disputes but NOT settlement approvals", async () => {
    const prisma = mkPrisma({
      applications: [
        { id: "a1", applicantName: "Alice", organization: "ACME", status: "PENDING", createdAt: ago(30) },
      ],
      approvals: [
        { id: "ap1", status: "PENDING", actionType: "LOCK", entityType: "SETTLEMENT_CYCLE", entityId: "c1", requestedById: "u_other", reason: null, createdAt: ago(20) },
      ],
      cycles: [
        { id: "c1", kind: "MONTH", startAt: ago(60 * 24 * 30), endAt: ago(0), status: "LOCK_PENDING_APPROVAL" },
      ],
      disputes: [
        { id: "d1", targetType: "NODE", targetId: "n1", reason: "bad", status: "OPEN", createdAt: ago(60) },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "REVIEWER", now: NOW });
    const kinds = view.items.map((i) => i.kind);
    expect(kinds).toContain("application");
    expect(kinds).toContain("dispute");
    expect(kinds).not.toContain("settlement_lock");
  });

  it("FINANCE_ADMIN sees settlement approvals but NOT applications/disputes", async () => {
    const prisma = mkPrisma({
      applications: [
        { id: "a1", applicantName: "Alice", organization: "ACME", status: "PENDING", createdAt: ago(30) },
      ],
      approvals: [
        { id: "ap1", status: "PENDING", actionType: "LOCK", entityType: "SETTLEMENT_CYCLE", entityId: "c1", requestedById: "u_other", reason: null, createdAt: ago(20) },
      ],
      cycles: [
        { id: "c1", kind: "MONTH", startAt: ago(60 * 24 * 30), endAt: ago(0), status: "LOCK_PENDING_APPROVAL" },
      ],
      disputes: [
        { id: "d1", targetType: "NODE", targetId: "n1", reason: "bad", status: "OPEN", createdAt: ago(60) },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "FINANCE_ADMIN", now: NOW });
    const kinds = view.items.map((i) => i.kind);
    expect(kinds).toEqual(["settlement_lock"]);
  });

  it("ADMIN sees all three sources", async () => {
    const prisma = mkPrisma({
      applications: [
        { id: "a1", applicantName: "Alice", organization: "ACME", status: "PENDING", createdAt: ago(30) },
      ],
      approvals: [
        { id: "ap1", status: "PENDING", actionType: "LOCK", entityType: "SETTLEMENT_CYCLE", entityId: "c1", requestedById: "u_other", reason: null, createdAt: ago(20) },
      ],
      cycles: [
        { id: "c1", kind: "MONTH", startAt: ago(60 * 24 * 30), endAt: ago(0), status: "LOCK_PENDING_APPROVAL" },
      ],
      disputes: [
        { id: "d1", targetType: "NODE", targetId: "n1", reason: "bad", status: "OPEN", createdAt: ago(60) },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "ADMIN", now: NOW, topN: 10 });
    const kinds = view.items.map((i) => i.kind).sort();
    expect(kinds).toEqual(["application", "dispute", "settlement_lock"]);
  });
});

describe("buildInboxView — maker-checker on settlement", () => {
  it("excludes settlement approvals where actor is the requester", async () => {
    const prisma = mkPrisma({
      approvals: [
        { id: "ap_self", status: "PENDING", actionType: "LOCK", entityType: "SETTLEMENT_CYCLE", entityId: "c1", requestedById: "u_admin", reason: null, createdAt: ago(20) },
        { id: "ap_other", status: "PENDING", actionType: "LOCK", entityType: "SETTLEMENT_CYCLE", entityId: "c2", requestedById: "u_other", reason: null, createdAt: ago(10) },
      ],
      cycles: [
        { id: "c1", kind: "MONTH", startAt: ago(99999), endAt: ago(0), status: "LOCK_PENDING_APPROVAL" },
        { id: "c2", kind: "WEEK", startAt: ago(99999), endAt: ago(0), status: "LOCK_PENDING_APPROVAL" },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u_admin", role: "ADMIN", now: NOW, topN: 10 });
    const ids = view.items.filter((i) => i.kind === "settlement_lock").map((i) => i.id);
    expect(ids).toEqual(["ap_other"]);
  });
});

describe("buildInboxView — sort and topN", () => {
  it("sorts settlement (90) before dispute (70) before application (50)", async () => {
    const prisma = mkPrisma({
      applications: [
        { id: "a1", applicantName: "Alice", organization: null, status: "PENDING", createdAt: ago(5) },
      ],
      approvals: [
        { id: "ap1", status: "PENDING", actionType: "LOCK", entityType: "SETTLEMENT_CYCLE", entityId: "c1", requestedById: "u_other", reason: null, createdAt: ago(60) },
      ],
      cycles: [
        { id: "c1", kind: "MONTH", startAt: ago(99999), endAt: ago(0), status: "LOCK_PENDING_APPROVAL" },
      ],
      disputes: [
        { id: "d1", targetType: "NODE", targetId: "n1", reason: "bad", status: "OPEN", createdAt: ago(30) },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "ADMIN", now: NOW, topN: 10 });
    expect(view.items.map((i) => i.kind)).toEqual([
      "settlement_lock",
      "dispute",
      "application",
    ]);
  });

  it("topN clips items but totalCount reflects unsliced length", async () => {
    const prisma = mkPrisma({
      disputes: Array.from({ length: 6 }, (_, i) => ({
        id: `d${i}`,
        targetType: "NODE" as const,
        targetId: `n${i}`,
        reason: `r${i}`,
        status: "OPEN" as const,
        createdAt: ago(i),
      })),
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "ADMIN", now: NOW, topN: 3 });
    expect(view.items.length).toBe(3);
    expect(view.totalCount).toBe(6);
  });
});

describe("buildInboxView — workspace scoping", () => {
  it("when workspaceId is provided, applications and disputes are filtered by it", async () => {
    const prisma = mkPrisma({
      applications: [
        { id: "a_in", applicantName: "Alice", organization: null, status: "PENDING", createdAt: ago(5), workspaceId: "ws_1" },
        { id: "a_out", applicantName: "Bob", organization: null, status: "PENDING", createdAt: ago(10), workspaceId: "ws_2" },
      ],
      disputes: [
        { id: "d_in", targetType: "NODE", targetId: "n1", reason: "in", status: "OPEN", createdAt: ago(15), workspaceId: "ws_1" },
        { id: "d_out", targetType: "NODE", targetId: "n2", reason: "out", status: "OPEN", createdAt: ago(20), workspaceId: "ws_2" },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "ADMIN", workspaceId: "ws_1", now: NOW, topN: 10 });
    const ids = view.items.map((i) => i.id);
    expect(ids).toContain("a_in");
    expect(ids).toContain("d_in");
    expect(ids).not.toContain("a_out");
    expect(ids).not.toContain("d_out");
  });
});

describe("buildInboxView — output shape", () => {
  it("application items carry organization + status + age in context", async () => {
    const prisma = mkPrisma({
      applications: [
        { id: "a1", applicantName: "Alice", organization: "ACME Labs", status: "REVIEWING", createdAt: ago(125) },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "ADMIN", now: NOW });
    expect(view.items).toHaveLength(1);
    const item = view.items[0];
    expect(item.title).toBe("Application from Alice");
    expect(item.context).toContain("ACME Labs");
    expect(item.context).toContain("REVIEWING");
    expect(item.context).toContain("2h ago");
    expect(item.href).toBe("/dashboard/applications");
    expect(item.kind).toBe("application");
  });

  it("ageFromNow falls through buckets correctly", async () => {
    const prisma = mkPrisma({
      disputes: [
        { id: "d_recent", targetType: "NODE", targetId: "n1", reason: "fresh", status: "OPEN", createdAt: ago(0.5) },
        { id: "d_mins",   targetType: "NODE", targetId: "n2", reason: "mins",  status: "OPEN", createdAt: ago(10) },
        { id: "d_hours",  targetType: "NODE", targetId: "n3", reason: "hours", status: "OPEN", createdAt: ago(180) },
        { id: "d_days",   targetType: "NODE", targetId: "n4", reason: "days",  status: "OPEN", createdAt: ago(60 * 48) },
      ],
    });
    const view = await buildInboxView({ prisma, userId: "u1", role: "ADMIN", now: NOW, topN: 10 });
    const byId = new Map(view.items.map((i) => [i.id, i]));
    expect(byId.get("d_recent")!.context).toContain("just now");
    expect(byId.get("d_mins")!.context).toContain("10m ago");
    expect(byId.get("d_hours")!.context).toContain("3h ago");
    expect(byId.get("d_days")!.context).toContain("2d ago");
  });
});
