import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { SettlementDistributedEvent } from "@/lib/core/event-types";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("export", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const cycle = await prisma.settlementCycle.findUnique({
    where: { id: params.id },
    include: { lines: { include: { node: { select: { id: true, name: true } } } } },
  });
  if (!cycle) return apiNotFound("SettlementCycle");

  if (!canTransitionSettlement(cycle.status, "EXPORTED")) {
    return apiValidationError([{ path: "status", message: `Cannot export from ${cycle.status}.` }]);
  }

  const updated = await prisma.settlementCycle.update({
    where: { id: params.id },
    data: { status: "EXPORTED", exportedAt: new Date(), exportedById: auth.session.user?.id ?? null },
  });

  const csvLines = ["node_id,node_name,score_total,allocation"];
  for (const line of cycle.lines) {
    csvLines.push(`${line.nodeId},${line.node.name},${line.scoreTotal},${line.allocation}`);
  }

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_EXPORT,
    targetType: "SETTLEMENT_CYCLE",
    targetId: params.id,
    metadata: { lineCount: cycle.lines.length },
  });

  const totalDistributed = cycle.lines.reduce((sum, l) => sum + l.allocation, 0);
  await eventBus.emit<SettlementDistributedEvent>(Events.SETTLEMENT_DISTRIBUTED, {
    cycleId: cycle.id,
    totalDistributed,
    nodeCount: cycle.lines.length,
  }, { actorId: auth.session.user?.id });

  return apiOk({ cycle: updated, csv: csvLines.join("\n") });
}
