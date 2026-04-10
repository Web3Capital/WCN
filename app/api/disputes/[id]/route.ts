import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "dispute");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.dispute.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Dispute");

  const data: Record<string, unknown> = {};

  if (body?.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED", "ESCALATED"]);
    if (!allowed.has(status)) return apiValidationError([{ path: "status", message: "Invalid status." }]);
    data.status = status;
    if (status === "RESOLVED" || status === "DISMISSED") {
      data.resolvedAt = new Date();
    }
  }

  if (body?.resolution !== undefined) data.resolution = body.resolution ? String(body.resolution) : null;

  const dispute = await prisma.dispute.update({ where: { id }, data });

  const auditAction = data.status === "ESCALATED" ? AuditAction.DISPUTE_ESCALATE : AuditAction.DISPUTE_RESOLVE;
  if (data.status && data.status !== existing.status) {
    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: auditAction,
      targetType: "DISPUTE",
      targetId: id,
      metadata: { previousStatus: existing.status, newStatus: data.status, resolution: data.resolution },
    });
  }

  return apiOk(dispute);
}
