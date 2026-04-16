import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, updatePolicySchema } from "@/lib/core/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const { id } = await params;
  const prisma = getPrisma();
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: { evaluations: { take: 20, orderBy: { evaluatedAt: "desc" } } },
  });
  if (!policy) return apiNotFound("Policy");

  return apiOk(policy);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const { id } = await params;
  const body = await req.json();
  const parsed = parseBody(updatePolicySchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const existing = await prisma.policy.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Policy");

  const { conditions, actions, rollbackLogic, ...rest } = parsed.data;
  const updateData: any = { ...rest, version: { increment: 1 } };
  if (conditions) updateData.conditions = conditions as any;
  if (actions) updateData.actions = actions as any;
  if (rollbackLogic !== undefined) updateData.rollbackLogic = rollbackLogic as any;

  const updated = await prisma.policy.update({
    where: { id },
    data: updateData,
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? "system",
    action: AuditAction.POLICY_UPDATE,
    targetType: "POLICY",
    targetId: id,
    metadata: { changedFields: Object.keys(parsed.data) },
  });

  return apiOk(updated);
}
