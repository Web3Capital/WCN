import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, apiForbidden, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createRiskFlagSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) return apiForbidden("Admin only.");

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");
  const resolved = searchParams.get("resolved");

  const where: Record<string, unknown> = {};
  if (severity) where.severity = severity;
  if (resolved === "true") where.resolvedAt = { not: null };
  if (resolved === "false") where.resolvedAt = null;

  const flags = await prisma.riskFlag.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiOk(flags);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "risk");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createRiskFlagSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { entityType, entityId, severity, reason } = parsed.data;

  const flag = await prisma.riskFlag.create({
    data: { entityType, entityId, severity, reason, raisedById: auth.session.user?.id ?? null },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.RISK_FLAG_CREATE,
    targetType: entityType,
    targetId: entityId,
    metadata: { severity, reason, riskFlagId: flag.id },
  });

  await eventBus.emit(Events.RISK_ALERT_CREATED, {
    alertId: flag.id,
    entityType,
    entityId,
    severity,
  }, { actorId: auth.session.user?.id });

  return apiCreated(flag);
}
