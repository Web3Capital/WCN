import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createPolicySchema } from "@/lib/core/validation";
import { createPolicy } from "@/lib/modules/policy";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "policy");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const status = searchParams.get("status") ?? "ACTIVE";

  const where: any = {};
  if (scope) where.scope = scope;
  if (status) where.status = status;

  const policies = await prisma.policy.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return apiOk(policies);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "policy");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json();
  const parsed = parseBody(createPolicySchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const { description, scopeRef, rollbackLogic, ...rest } = parsed.data;
  const policy = await createPolicy({
    ...rest,
    description: description ?? undefined,
    scopeRef: scopeRef ?? undefined,
    rollbackLogic: rollbackLogic ?? undefined,
    createdBy: auth.session.user?.id,
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? "system",
    action: AuditAction.POLICY_CREATE,
    targetType: "POLICY",
    targetId: policy.id,
    metadata: { name: policy.name, scope: policy.scope },
  });

  return apiCreated(policy);
}
