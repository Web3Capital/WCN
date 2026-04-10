import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { SettlementCalculatedEvent } from "@/lib/core/event-types";

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

  const approved = await prisma.poBRecord.findMany({
    where: {
      status: "APPROVED",
      createdAt: { gte: cycle.startAt, lte: cycle.endAt },
    },
    include: { attributions: true },
  });

  const totals = new Map<string, { scoreTotal: number; pobCount: number }>();
  for (const pob of approved) {
    for (const attr of pob.attributions) {
      const share = (pob.score * attr.shareBps) / 10000;
      const cur = totals.get(attr.nodeId) ?? { scoreTotal: 0, pobCount: 0 };
      cur.scoreTotal += share;
      cur.pobCount += 1;
      totals.set(attr.nodeId, cur);
    }
  }

  const networkScore = Array.from(totals.values()).reduce((s, v) => s + v.scoreTotal, 0);
  await prisma.settlementLine.deleteMany({ where: { cycleId: cycle.id } });

  const rows = Array.from(totals.entries()).map(([nodeId, v]) => ({
    cycleId: cycle.id,
    nodeId,
    scoreTotal: v.scoreTotal,
    pobCount: v.pobCount,
    allocation: networkScore > 0 ? (v.scoreTotal / networkScore) * cycle.pool : 0,
  }));

  if (rows.length) {
    await prisma.settlementLine.createMany({ data: rows });
  }

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
    metadata: { idempotent: false, lineCount: lines.length, networkScore, cycleStatus: cycle.status },
  });

  await eventBus.emit<SettlementCalculatedEvent>(Events.SETTLEMENT_CALCULATED, {
    cycleId: cycle.id,
    totalEntries: lines.length,
    totalAmount: networkScore,
  }, { actorId: admin.session.user?.id });

  return apiOk({ idempotent: false, cycle, networkScore, lines });
}
