import type { Prisma } from "@prisma/client";
import { ApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { ApiCode, apiError } from "@/lib/api-error";
import { AuditAction, writeAudit } from "@/lib/audit";
import { assertPoBStatusValue, canTransitionPoBStatus, pobTransitionErrorMessage } from "@/lib/pob-state";
import { canTransitionPoB } from "@/lib/state-machines/evidence-pob";
import type { PoBEventStatus } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
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

  if (!record) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  return NextResponse.json({ ok: true, record });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiError(ApiCode.UNAUTHORIZED, "Unauthorized.", 401);

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.poBRecord.findUnique({ where: { id: params.id } });
  if (!existing) return apiError(ApiCode.NOT_FOUND, "PoB record not found.", 404);

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
      return apiError(ApiCode.VALIDATION_ERROR, "Invalid status.", 400, { allowed: ["PENDING", "REVIEWING", "APPROVED", "REJECTED"] });
    }
    if (!canTransitionPoBStatus(existing.status, status)) {
      return apiError(ApiCode.POB_INVALID_TRANSITION, pobTransitionErrorMessage(existing.status, status), 409, { from: existing.status, to: status });
    }
    data.status = status as ApplicationStatus;
  }

  if (body?.pobEventStatus !== undefined) {
    const newStatus = String(body.pobEventStatus) as PoBEventStatus;
    if (!canTransitionPoB(existing.pobEventStatus, newStatus)) {
      return NextResponse.json({
        ok: false,
        error: `Cannot transition PoB event from ${existing.pobEventStatus} to ${newStatus}.`,
      }, { status: 400 });
    }
    data.pobEventStatus = newStatus;

    if (newStatus === "FROZEN") {
      data.frozenAt = new Date();
      data.frozenReason = body?.frozenReason ? String(body.frozenReason) : null;
    }
  }

  if (Object.keys(data).length === 0) {
    return apiError(ApiCode.VALIDATION_ERROR, "No valid fields to update.", 400);
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
        reviewerId: admin.session.user?.id ?? null,
      },
    });
  }

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.POB_STATUS_CHANGE,
    targetType: "POB",
    targetId: params.id,
    metadata: {
      previousStatus: existing.status, nextStatus: record.status,
      previousEventStatus: existing.pobEventStatus, nextEventStatus: record.pobEventStatus,
    },
  });

  return NextResponse.json({ ok: true, record });
}
