import "@/lib/core/init";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";
import { activatePolicy } from "@/lib/modules/policy";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("manage", "policy");
  if (!auth.ok) return apiUnauthorized();

  const { id } = await params;
  const userId = auth.session.user?.id ?? "system";

  await activatePolicy(id, userId);

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.POLICY_ACTIVATE,
    targetType: "POLICY",
    targetId: id,
    metadata: { action: "activate" },
  });

  return apiOk({ id, status: "ACTIVE" });
}
