import "@/lib/core/init";
import type { Prisma } from "@prisma/client";
import { PoBRecordStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { getOwnedNodeIds, memberPoBWhere } from "@/lib/member-data-scope";
import { ownsPoB } from "@/lib/auth/resource-scope";
import { assertPoBStatusValue, canTransitionPoBStatus, pobTransitionErrorMessage } from "@/lib/pob-state";
import { canTransitionPoB } from "@/lib/state-machines/evidence-pob";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError, apiConflict } from "@/lib/core/api-response";
import type { PoBEventStatus } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
    const scoped = await prisma.poBRecord.findFirst({
      where: { id: params.id, ...memberPoBWhere(ownedNodeIds) },
      select: { id: true },
    });
    if (!scoped) return apiUnauthorized();
  }

  const record = await prisma.poBRecord.findUnique({
    where: { id: params.id },
    include: {
      task: { select: { id: true, title: true, status: true } },
      project: { select: { id: true, name: true } },
      node: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, stage: true } },
      attributions: { include: { node: { select: { id: true, name: true } } } },
      confirmations: { orderBy: { createdAt: "desc" } },
      disputes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!record) return apiNotFound("PoBRecord");

  return apiOk(record);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "pob");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.poBRecord.findUnique({ where: { id: params.id } });
  if (!existing) return apiNotFound("PoBRecord");

  // Row-level scope: non-admin must own the PoB (linked node/task/project).
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && !(await ownsPoB(prisma, auth.session.user!.id, params.id))) {
    return apiUnauthorized();
  }

  const data: Prisma.PoBRecordUpdateInput = {};
  if (body?.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
  if (body?.leadNodeId !== undefined) data.leadNodeId = body.leadNodeId ? String(body.leadNodeId) : null;
  if (body?.beneficiaryEntity !== undefined) data.beneficiaryEntity = body.beneficiaryEntity ? String(body.beneficiaryEntity) : null;
  if (body?.loopType !== undefined) data.loopType = body.loopType ? String(body.loopType) : null;

  if (body?.supportingNodeIds !== undefined) {
    data.supportingNodeIds = Array.isArray(body.supportingNodeIds)
      ? body.supportingNodeIds.map((s: unknown) => String(s))
      : [];
  }

  if (body?.status !== undefined) {
    const status = String(body.status);
    if (!assertPoBStatusValue(status)) {
      return apiValidationError([{ path: "status", message: "Invalid status." }]);
    }
    if (!canTransitionPoBStatus(existing.status, status)) {
      return apiConflict(pobTransitionErrorMessage(existing.status, status));
    }
    data.status = status as PoBRecordStatus;
  }

  if (body?.pobEventStatus !== undefined) {
    const newStatus = String(body.pobEventStatus) as PoBEventStatus;
    if (!canTransitionPoB(existing.pobEventStatus, newStatus)) {
      return apiValidationError([{ path: "pobEventStatus", message: `Cannot transition from ${existing.pobEventStatus} to ${newStatus}.` }]);
    }
    data.pobEventStatus = newStatus;

    if (newStatus === "FROZEN") {
      data.frozenAt = new Date();
      data.frozenReason = body?.frozenReason ? String(body.frozenReason) : null;
    }
  }

  if (Object.keys(data).length === 0) {
    return apiValidationError([{ path: "body", message: "No valid fields to update." }]);
  }

  const record = await prisma.poBRecord.update({ where: { id: params.id }, data });

  if ((data.status && data.status !== existing.status) || (data.pobEventStatus && data.pobEventStatus !== existing.pobEventStatus)) {
    const decision = data.status === "APPROVED" || data.pobEventStatus === "EFFECTIVE" ? "APPROVE"
      : data.status === "REJECTED" || data.pobEventStatus === "REJECTED" ? "REJECT" : "NEEDS_CHANGES";
    await prisma.review.create({
      data: {
        targetType: "POB", targetId: params.id,
        decision: decision as any,
        notes: data.notes !== undefined ? (data.notes as string | null) : null,
        status: "RESOLVED",
        reviewerId: auth.session.user?.id ?? null,
      },
    });
  }

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.POB_STATUS_CHANGE,
    targetType: "POB",
    targetId: params.id,
    metadata: {
      previousStatus: existing.status, nextStatus: record.status,
      previousEventStatus: existing.pobEventStatus, nextEventStatus: record.pobEventStatus,
    },
  });

  return apiOk(record);
}
