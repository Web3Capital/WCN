import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiConflict } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { SettlementCalculatedEvent } from "@/lib/core/event-types";
import { calculateSettlementForCycle } from "@/lib/modules/settlement/calculator";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const cycle = await prisma.settlementCycle.findUnique({ where: { id: params.id } });
  if (!cycle) return apiNotFound("SettlementCycle");

  const existingCount = await prisma.settlementLine.count({ where: { cycleId: cycle.id } });
  if (existingCount > 0 && (cycle.status === "LOCKED" || cycle.status === "FINALIZED")) {
    const lines = await prisma.settlementLine.findMany({
      where: { cycleId: cycle.id },
      orderBy: { allocation: "desc" },
      include: { node: true },
    });
    const networkScore = lines.reduce((s, l) => s + l.scoreTotal, 0);
    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.SETTLEMENT_LINES_GENERATE,
      targetType: "SETTLEMENT_CYCLE",
      targetId: cycle.id,
      metadata: { idempotent: true, lineCount: lines.length, cycleStatus: cycle.status },
    });
    return apiOk({ idempotent: true, cycle, networkScore, lines });
  }

  if (!canTransitionSettlement(cycle.status, "RECONCILED")) {
    return apiConflict(`Cannot generate lines: cycle status is '${cycle.status}', expected 'DRAFT'`);
  }

  const result = await calculateSettlementForCycle(cycle.id);

  await prisma.settlementCycle.update({
    where: { id: cycle.id },
    data: { status: "RECONCILED" },
  });

  const lines = await prisma.settlementLine.findMany({
    where: { cycleId: cycle.id },
    orderBy: { allocation: "desc" },
    include: { node: true },
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_LINES_GENERATE,
    targetType: "SETTLEMENT_CYCLE",
    targetId: cycle.id,
    metadata: {
      idempotent: false,
      lineCount: result.lineCount,
      networkScore: result.networkScore,
      platformFee: result.platformFee,
      distributablePool: result.distributablePool,
      cycleStatus: "RECONCILED",
    },
  });

  await eventBus.emit<SettlementCalculatedEvent>(Events.SETTLEMENT_CALCULATED, {
    cycleId: cycle.id,
    totalEntries: result.lineCount,
    totalAmount: result.distributablePool,
  }, { actorId: admin.session.user?.id });

  return apiOk({ idempotent: false, cycle: { ...cycle, status: "RECONCILED" }, networkScore: result.networkScore, lines });
}
