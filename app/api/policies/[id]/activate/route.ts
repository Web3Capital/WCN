import "@/lib/core/init";
import { requireAdmin } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";
import { activatePolicy } from "@/lib/modules/policy";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const { id } = await params;
  const userId = admin.session.user?.id ?? "system";

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
