import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { executeSettlementPayout } from "@/lib/modules/payment/executor";

export async function POST(req: Request) {
  const auth = await requirePermission("manage", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  if (!body?.cycleId) {
    return apiValidationError([{ path: "cycleId", message: "cycleId is required" }]);
  }

  const prisma = getPrisma();
  const result = await executeSettlementPayout(prisma, body.cycleId);

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.SETTLEMENT_EXPORT,
    targetType: "SETTLEMENT_CYCLE",
    targetId: body.cycleId,
    metadata: result,
  });

  return apiOk(result);
}
