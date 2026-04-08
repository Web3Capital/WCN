import type { Prisma } from "@prisma/client";
import { ApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ApiCode, apiError } from "@/lib/api-error";
import { AuditAction, writeAudit } from "@/lib/audit";
import { assertPoBStatusValue, canTransitionPoBStatus, pobTransitionErrorMessage } from "@/lib/pob-state";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return apiError(ApiCode.UNAUTHORIZED, "Unauthorized.", 401);
  }

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.poBRecord.findUnique({ where: { id: params.id } });
  if (!existing) {
    return apiError(ApiCode.NOT_FOUND, "PoB record not found.", 404);
  }

  const data: Prisma.PoBRecordUpdateInput = {};
  if (body?.notes !== undefined) {
    data.notes = body.notes ? String(body.notes) : null;
  }

  if (body?.status !== undefined) {
    const status = String(body.status);
    if (!assertPoBStatusValue(status)) {
      return apiError(ApiCode.VALIDATION_ERROR, "Invalid status.", 400, { allowed: ["PENDING", "REVIEWING", "APPROVED", "REJECTED"] });
    }
    if (!canTransitionPoBStatus(existing.status, status)) {
      return apiError(
        ApiCode.POB_INVALID_TRANSITION,
        pobTransitionErrorMessage(existing.status, status),
        409,
        { from: existing.status, to: status }
      );
    }
    data.status = status as ApplicationStatus;
  }

  if (Object.keys(data).length === 0) {
    return apiError(ApiCode.VALIDATION_ERROR, "No valid fields to update.", 400);
  }

  const record = await prisma.poBRecord.update({ where: { id: params.id }, data });

  if (data.status && data.status !== existing.status) {
    const decision =
      data.status === "APPROVED" ? "APPROVE" : data.status === "REJECTED" ? "REJECT" : "NEEDS_CHANGES";
    await prisma.review.create({
      data: {
        targetType: "POB",
        targetId: params.id,
        decision: decision as any,
        notes: data.notes !== undefined ? (data.notes as string | null) : null,
        status: "RESOLVED",
        reviewerId: admin.session.user?.id ?? null
      }
    });
  }

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.POB_UPDATE,
    targetType: "POB",
    targetId: params.id,
    metadata: {
      patch: { notes: data.notes !== undefined ? data.notes : undefined, status: data.status },
      previousStatus: existing.status,
      nextStatus: record.status
    }
  });

  return NextResponse.json({ ok: true, record });
}
