import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { canTransitionNode } from "@/lib/state-machines/node";
import { AuditAction, writeAudit } from "@/lib/audit";
import { redactNodeForMember } from "@/lib/member-redact";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { NodeStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { withApiContext } from "@/lib/logger";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  const node = await prisma.node.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      seats: { orderBy: { createdAt: "desc" } },
      stakeLedger: { orderBy: { createdAt: "desc" }, take: 20 },
      penalties: { orderBy: { createdAt: "desc" }, take: 20 },
      projects: { select: { id: true, name: true, status: true }, take: 20 },
      tasksAsOwner: { select: { id: true, title: true, status: true }, take: 20, orderBy: { createdAt: "desc" } },
      ownedAgents: { select: { id: true, name: true, status: true, type: true } },
      _count: { select: { pobRecords: true, settlementLines: true, assignments: true } },
    },
  });

  if (!node) return apiNotFound("Node");

  const visibility =
    isAdmin || node.ownerUserId === auth.session.user?.id ? "full" : "redacted";
  withApiContext("GET /api/nodes/[id]", {
    userId: auth.session.user?.id,
    nodeId: params.id,
  }).info({ event: "node_detail", visibility }, "node detail");

  if (!isAdmin && node.ownerUserId !== auth.session.user?.id) {
    return apiOk(redactNodeForMember(node));
  }

  return apiOk(node);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.node.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!existing) return apiNotFound("Node");

  const data: Record<string, unknown> = {};

  const stringFields = [
    "name", "description", "region", "city", "jurisdiction", "vertical",
    "entityName", "entityType", "contactName", "contactEmail",
    "resourcesOffered", "pastCases", "recommendation", "riskLevel",
    "billingStatus", "depositStatus", "seatFeeStatus",
  ] as const;
  for (const f of stringFields) {
    if (body?.[f] !== undefined) data[f] = body[f] ? String(body[f]).trim() : null;
  }

  if (body?.level !== undefined) data.level = Number(body.level);
  if (body?.ownerUserId !== undefined) data.ownerUserId = body.ownerUserId ? String(body.ownerUserId) : null;
  if (body?.onboardingScore !== undefined) data.onboardingScore = body.onboardingScore != null ? Number(body.onboardingScore) : null;

  if (body?.tags !== undefined) {
    data.tags = Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [];
  }
  if (body?.allowedServices !== undefined) {
    data.allowedServices = Array.isArray(body.allowedServices) ? body.allowedServices.map((s: unknown) => String(s).trim()).filter(Boolean) : [];
  }

  if (body?.territoryJson !== undefined) {
    if (body.territoryJson === null) {
      data.territoryJson = Prisma.DbNull;
    } else if (typeof body.territoryJson === "object" && !Array.isArray(body.territoryJson)) {
      data.territoryJson = body.territoryJson as Prisma.InputJsonValue;
    } else {
      return apiValidationError([{ path: "territoryJson", message: "territoryJson must be a JSON object or null." }]);
    }
  }

  if (body?.type !== undefined) {
    const type = String(body.type);
    const allowedTypes = new Set(["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"]);
    if (!allowedTypes.has(type)) return apiValidationError([{ path: "type", message: "Invalid node type." }]);
    data.type = type;
  }

  if (body?.status !== undefined) {
    const newStatus = String(body.status) as NodeStatus;
    if (!canTransitionNode(existing.status, newStatus)) {
      return apiValidationError([{ path: "status", message: `Cannot transition from ${existing.status} to ${newStatus}.` }]);
    }
    data.status = newStatus;

    if (newStatus === "LIVE" && !data.goLiveAt) data.goLiveAt = new Date();
    if (newStatus === "OFFBOARDED" && !data.offboardedAt) data.offboardedAt = new Date();
    if (newStatus === "PROBATION" && !data.probationStartAt) data.probationStartAt = new Date();
  }

  const node = await prisma.node.update({ where: { id: params.id }, data });

  const statusChanged = Boolean(data.status && data.status !== existing.status);
  const statusSideEffectKeys = new Set(["goLiveAt", "offboardedAt", "probationStartAt", "probationEndAt"]);
  const fieldsForProfileAudit = Object.keys(data).filter((k) => {
    if (k === "status") return false;
    if (statusChanged && statusSideEffectKeys.has(k)) return false;
    return true;
  });
  if (fieldsForProfileAudit.length > 0) {
    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.NODE_UPDATE,
      targetType: "NODE",
      targetId: params.id,
      metadata: { fields: fieldsForProfileAudit },
    });
  }

  if (data.status && data.status !== existing.status) {
    await prisma.review.create({
      data: {
        targetType: "NODE",
        targetId: params.id,
        decision: data.status === "REJECTED" || data.status === "OFFBOARDED" ? "REJECT" : data.status === "NEED_MORE_INFO" ? "NEEDS_CHANGES" : "APPROVE",
        notes: body?.notes ? String(body.notes) : null,
        status: "RESOLVED",
        reviewerId: admin.session.user?.id ?? null,
      },
    });

    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.NODE_STATUS_CHANGE,
      targetType: "NODE",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: data.status, notes: body?.notes },
    });

    await eventBus.emit(Events.NODE_STATUS_CHANGED, {
      nodeId: params.id,
      oldStatus: existing.status,
      newStatus: String(data.status),
      changedBy: admin.session.user?.id ?? "system",
    }, { actorId: admin.session.user?.id });

    if (data.status === "LIVE") {
      await eventBus.emit(Events.NODE_ACTIVATED, {
        nodeId: params.id,
        activatedBy: admin.session.user?.id ?? "system",
      }, { actorId: admin.session.user?.id });
    }
  }

  withApiContext("PATCH /api/nodes/[id]", {
    actorUserId: admin.session.user?.id ?? undefined,
    nodeId: params.id,
  }).info(
    {
      event: "node_patch",
      statusChanged: Boolean(data.status && data.status !== existing.status),
      profileFieldsUpdated: fieldsForProfileAudit.length,
    },
    "node patched",
  );

  return apiOk(node);
}
