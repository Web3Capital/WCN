import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createPolicySchema } from "@/lib/core/validation";
import { createPolicy } from "@/lib/modules/policy";

export async function GET(req: Request) {
  // Use the permissions matrix as the single source of truth. The previous
  // inline `isAdminRole` check was a hold-out from the requireAdmin →
  // requirePermission migration (lib/admin.ts line 44 comment) and
  // contradicted `lib/permissions.ts`, where USER (and every other signed-in
  // role) has `policy: ["read"]` by design — see the e2e ratchet
  // `rbac-policies.spec.ts:37` "deliberate widening from Week 2 Day 4".
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
