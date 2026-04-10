import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: {
      ownerNode: { select: { id: true, name: true, ownerUserId: true } },
      permissions: true,
      runs: { select: { id: true, taskId: true, status: true, cost: true, startedAt: true, finishedAt: true }, take: 20, orderBy: { startedAt: "desc" } },
      logs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!agent) return apiNotFound("Agent");

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    (agent as any).endpoint = null;
  }

  return apiOk(agent);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.agent.findUnique({ where: { id: params.id }, select: { id: true, status: true, freezeLevel: true } });
  if (!existing) return apiNotFound("Agent");

  const data: Record<string, unknown> = {};
  if (body?.name !== undefined) data.name = String(body.name).trim();
  if (body?.endpoint !== undefined) data.endpoint = body.endpoint ? String(body.endpoint) : null;
  if (body?.version !== undefined) data.version = Number(body.version);

  if (body?.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(["ACTIVE", "DISABLED", "SUSPENDED"]);
    if (!allowed.has(status)) return apiValidationError([{ path: "status", message: "Invalid status." }]);
    data.status = status;
  }

  if (body?.freezeLevel !== undefined) {
    const level = body.freezeLevel;
    const allowed = new Set(["L1_TASK", "L2_INSTANCE", "L3_CLASS", null]);
    if (!allowed.has(level)) return apiValidationError([{ path: "freezeLevel", message: "Invalid freeze level." }]);
    data.freezeLevel = level;

    if (level) {
      data.status = "SUSPENDED";
      await writeAudit({
        actorUserId: admin.session.user?.id ?? null,
        action: AuditAction.AGENT_FREEZE,
        targetType: "AGENT",
        targetId: params.id,
        metadata: { freezeLevel: level, reason: body?.reason },
      });
    }
  }

  const agent = await prisma.agent.update({
    where: { id: params.id },
    data,
    include: { ownerNode: true, permissions: true },
  });

  if (data.status && data.status !== existing.status) {
    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.AGENT_STATUS_CHANGE,
      targetType: "AGENT",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: data.status },
    });
  }

  return apiOk(agent);
}
