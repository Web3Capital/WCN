import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiForbidden, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createPolicySchema } from "@/lib/core/validation";
import { createPolicy } from "@/lib/modules/policy";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();
  if (!isAdminRole(auth.session.user?.role ?? "USER")) return apiForbidden();

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
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const body = await req.json();
  const parsed = parseBody(createPolicySchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const { description, scopeRef, rollbackLogic, ...rest } = parsed.data;
  const policy = await createPolicy({
    ...rest,
    description: description ?? undefined,
    scopeRef: scopeRef ?? undefined,
    rollbackLogic: rollbackLogic ?? undefined,
    createdBy: admin.session.user?.id,
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? "system",
    action: AuditAction.POLICY_CREATE,
    targetType: "POLICY",
    targetId: policy.id,
    metadata: { name: policy.name, scope: policy.scope },
  });

  return apiCreated(policy);
}
