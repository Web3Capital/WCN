import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { getOwnedNodeIds, memberPoBWhere } from "@/lib/member-data-scope";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createDisputeSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;

  const { searchParams } = new URL(req.url);
  const pobId = searchParams.get("pobId");
  const targetType = searchParams.get("targetType");
  const status = searchParams.get("status");

  const where: Prisma.DisputeWhereInput = {};
  if (pobId) where.pobId = pobId;
  if (targetType) where.targetType = targetType as any;
  if (status) where.status = status as any;

  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, userId);
    where.pob = memberPoBWhere(ownedNodeIds) as any;
  }

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      pob: { select: { id: true, businessType: true, nodeId: true, dealId: true } },
    },
  });

  return apiOk(disputes);
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createDisputeSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { reason, targetType, targetId, pobId } = parsed.data;
  const windowDays = 5;
  const windowEndsAt = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);

  const dispute = await prisma.dispute.create({
    data: {
      reason,
      targetType: targetType as any,
      targetId,
      pobId: pobId ?? null,
      windowEndsAt,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.DISPUTE_CREATE,
    targetType: "DISPUTE",
    targetId: dispute.id,
    metadata: { pobId: pobId ?? null, reason, disputeTargetType: targetType, disputeTargetId: targetId, windowEndsAt: windowEndsAt.toISOString() },
  });

  if (pobId) {
    await eventBus.emit(Events.POB_DISPUTE_RAISED, {
      disputeId: dispute.id,
      pobId,
      raisedBy: auth.session.user?.id ?? "unknown",
    }, { actorId: auth.session.user?.id });
  }

  return apiCreated(dispute);
}
