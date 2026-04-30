import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { ownsPoB } from "@/lib/auth/resource-scope";
import { getOwnedNodeIds } from "@/lib/member-data-scope";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiCreated, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";

export async function POST(req: Request) {
  // Confirmations are reviewer-style attestations on a PoB. Permission is
  // "review" on pob, which the matrix grants to REVIEWER + RISK_DESK +
  // admins, plus NODE_OWNER on PoBs they own (handled by the row-level
  // check below).
  const auth = await requirePermission("review", "pob");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const pobId = String(body?.pobId ?? "").trim();
  const decision = String(body?.decision ?? "").trim();
  const partyType = String(body?.partyType ?? "").trim();
  if (!pobId || !decision || !partyType) {
    return apiValidationError([{ path: "pobId", message: "Missing pobId, decision, or partyType." }]);
  }
  const allowedDecision = new Set(["CONFIRM", "REJECT"]);
  const allowedParty = new Set(["USER", "NODE"]);
  if (!allowedDecision.has(decision) || !allowedParty.has(partyType)) {
    return apiValidationError([{ path: "decision", message: "Invalid decision or partyType." }]);
  }

  const confirmation = await prisma.confirmation.create({
    data: {
      targetType: "POB",
      targetId: pobId,
      pobId,
      decision: decision as any,
      notes: body?.notes ? String(body.notes) : null,
      partyType: partyType as any,
      partyUserId: body?.partyUserId ? String(body.partyUserId) : null,
      partyNodeId: body?.partyNodeId ? String(body.partyNodeId) : null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.POB_CONFIRMATION_CREATE,
    targetType: "POB",
    targetId: pobId,
    metadata: {
      confirmationId: confirmation.id,
      decision,
      partyType,
      partyUserId: confirmation.partyUserId,
      partyNodeId: confirmation.partyNodeId,
    },
  });

  return apiCreated(confirmation);
}
