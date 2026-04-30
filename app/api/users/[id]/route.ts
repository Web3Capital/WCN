import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, updateUserRoleSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { Role } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "user");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(updateUserRoleSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, role: true } });
  if (!existing) return apiNotFound("User");

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: parsed.data.role as Role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.USER_ROLE_CHANGE,
    targetType: "USER",
    targetId: params.id,
    metadata: { previousRole: existing.role, newRole: parsed.data.role },
  });

  await eventBus.emit(Events.USER_ROLE_CHANGED, {
    userId: params.id,
    oldRole: existing.role,
    newRole: parsed.data.role,
    changedBy: auth.session.user?.id ?? "system",
  }, { actorId: auth.session.user?.id });

  return apiOk(updated);
}
