import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiConflict } from "@/lib/core/api-response";
import { calculateSettlementForCycle } from "@/lib/modules/settlement/calculator";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const cycle = await prisma.settlementCycle.findUnique({ where: { id: params.id } });
  if (!cycle) return apiNotFound("SettlementCycle");

  if (!canTransitionSettlement(cycle.status, "RECONCILED")) {
    return apiConflict(`Cannot reconcile: cycle status is '${cycle.status}', expected 'DRAFT'`);
  }

  const result = await calculateSettlementForCycle(cycle.id);

  await prisma.settlementCycle.update({
    where: { id: cycle.id },
    data: { status: "RECONCILED" },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_LINES_GENERATE,
    targetType: "SETTLEMENT_CYCLE",
    targetId: cycle.id,
    metadata: {
      action: "reconcile",
      lineCount: result.lineCount,
      networkScore: result.networkScore,
      platformFee: result.platformFee,
      distributablePool: result.distributablePool,
    },
  });

  return apiOk({ ...result, status: "RECONCILED" });
}
