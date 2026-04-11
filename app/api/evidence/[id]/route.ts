import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { canTransitionEvidence } from "@/lib/state-machines/evidence-pob";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { getOwnedNodeIds, memberEvidenceWhere } from "@/lib/member-data-scope";
import type { EvidenceReviewStatus } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
    const scoped = await prisma.evidence.findFirst({
      where: { id: params.id, ...memberEvidenceWhere(ownedNodeIds) },
      select: { id: true },
    });
    if (!scoped) return apiUnauthorized();
  }

  const evidence = await prisma.evidence.findUnique({
    where: { id: params.id },
    include: {
      task: { select: { id: true, title: true, status: true } },
      project: { select: { id: true, name: true } },
      node: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, stage: true } },
    },
  });

  if (!evidence) return apiNotFound("Evidence");

  return apiOk(evidence);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "evidence");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
    const scoped = await prisma.evidence.findFirst({
      where: { id: params.id, ...memberEvidenceWhere(ownedNodeIds) },
      select: { id: true },
    });
    if (!scoped) return apiUnauthorized();
  }

  const body = await req.json().catch(() => ({}));

  const existing = await prisma.evidence.findUnique({ where: { id: params.id }, select: { id: true, reviewStatus: true, dealId: true } });
  if (!existing) return apiNotFound("Evidence");

  const data: Record<string, unknown> = {};

  if (body?.title !== undefined) data.title = body.title ? String(body.title) : null;
  if (body?.summary !== undefined) data.summary = body.summary ? String(body.summary) : null;
  if (body?.url !== undefined) data.url = body.url ? String(body.url) : null;

  if (body?.reviewStatus !== undefined) {
    const newStatus = String(body.reviewStatus) as EvidenceReviewStatus;
    if (!canTransitionEvidence(existing.reviewStatus, newStatus)) {
      return apiValidationError([{ path: "reviewStatus", message: `Cannot transition from ${existing.reviewStatus} to ${newStatus}.` }]);
    }
    data.reviewStatus = newStatus;

    if (newStatus === "SUBMITTED") {
      data.slaDeadlineAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    if (newStatus === "APPROVED" || newStatus === "REJECTED") {
      data.reviewedAt = new Date();
      data.reviewerId = auth.session.user?.id ?? null;
    }
  }

  const evidence = await prisma.evidence.update({ where: { id: params.id }, data });

  if (data.reviewStatus && data.reviewStatus !== existing.reviewStatus) {
    await prisma.review.create({
      data: {
        targetType: "EVIDENCE",
        targetId: params.id,
        decision: data.reviewStatus === "APPROVED" ? "APPROVE" : data.reviewStatus === "REJECTED" ? "REJECT" : "NEEDS_CHANGES",
        notes: body?.notes ? String(body.notes) : null,
        status: "RESOLVED",
        reviewerId: auth.session.user?.id ?? null,
      },
    });

    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.EVIDENCE_REVIEW,
      targetType: "EVIDENCE",
      targetId: params.id,
      metadata: { previousStatus: existing.reviewStatus, newStatus: data.reviewStatus, notes: body?.notes },
    });

    if (data.reviewStatus === "APPROVED") {
      await eventBus.emit(Events.EVIDENCE_APPROVED, {
        evidenceId: params.id,
        dealId: existing.dealId ?? undefined,
        reviewerId: auth.session.user?.id ?? "system",
      }, { actorId: auth.session.user?.id });
    } else if (data.reviewStatus === "REJECTED") {
      await eventBus.emit(Events.EVIDENCE_REJECTED, {
        evidenceId: params.id,
        reason: body?.notes ?? "Rejected",
        reviewerId: auth.session.user?.id ?? "system",
      }, { actorId: auth.session.user?.id });
    }
  }

  return apiOk(evidence);
}
