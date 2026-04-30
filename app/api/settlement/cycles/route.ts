import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { redactSettlementCycleForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createSettlementCycleSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  const cycles = await prisma.settlementCycle.findMany({ orderBy: { startAt: "desc" }, take: 50 });

  return apiOk(isAdmin ? cycles : cycles.map(redactSettlementCycleForMember));
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "settlement");
  if (!auth.ok) return apiUnauthorized();
  const prisma = getPrisma();
  const rawBody = await req.json().catch(() => ({}));
  const o = typeof rawBody === "object" && rawBody !== null ? (rawBody as Record<string, unknown>) : {};
  const body = { ...o, kind: o.kind ?? "MONTH" };

  const parsed = parseBody(createSettlementCycleSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const { kind, startAt, endAt, pool } = parsed.data;
  const cycle = await prisma.settlementCycle.create({
    data: {
      kind,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      pool
    }
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_CYCLE_CREATE,
    targetType: "SETTLEMENT_CYCLE",
    targetId: cycle.id,
    metadata: { kind, pool, startAt, endAt },
  });

  await eventBus.emit(
    Events.SETTLEMENT_CYCLE_CREATED,
    {
      cycleId: cycle.id,
      periodStart: cycle.startAt.toISOString(),
      periodEnd: cycle.endAt.toISOString(),
    },
    { actorId: auth.session.user?.id }
  );

  return apiCreated({ cycle });
}
