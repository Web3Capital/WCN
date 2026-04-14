import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { redactProjectForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError, zodToApiError } from "@/lib/core/api-response";
import { parseBody, updateProjectSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { ProjectMachine, TransitionError } from "@/lib/core/state-machine";
import type { ProjectStatus } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      node: { select: { id: true, name: true, ownerUserId: true } },
      tasks: { select: { id: true, title: true, status: true, type: true }, take: 20, orderBy: { createdAt: "desc" } },
      pobRecords: { select: { id: true, businessType: true, score: true, status: true }, take: 10 },
      evidence: { select: { id: true, title: true, type: true, reviewStatus: true, createdAt: true }, take: 20, orderBy: { createdAt: "desc" } },
      _count: { select: { tasks: true, pobRecords: true, evidence: true, deals: true } },
    },
  });

  if (!project) return apiNotFound("Project");

  return apiOk(isAdmin ? project : redactProjectForMember(project, auth.session.user?.id ?? ""));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(updateProjectSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const existing = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!existing) return apiNotFound("Project");

  const d = parsed.data;

  if (d.status && d.status !== existing.status) {
    if (!ProjectMachine.canTransition(existing.status as ProjectStatus, d.status as ProjectStatus)) {
      const valid = ProjectMachine.validNext(existing.status as ProjectStatus);
      return apiValidationError([{
        path: "status",
        message: `Cannot transition from ${existing.status} to ${d.status}. Valid: [${valid.join(", ")}]`,
      }]);
    }
  }

  const data: Record<string, unknown> = {};

  const stringFields = [
    "name", "sector", "website", "pitchUrl", "fundraisingNeed",
    "contactName", "contactEmail", "contactTelegram", "description", "internalNotes",
  ] as const;
  for (const f of stringFields) {
    if (d[f] !== undefined) data[f] = d[f] ? String(d[f]).trim() : null;
  }

  if (d.stage !== undefined) data.stage = d.stage;
  if (d.internalScore !== undefined) data.internalScore = d.internalScore;
  if (d.nodeId !== undefined) data.nodeId = d.nodeId || null;
  if (d.confidentialityLevel !== undefined) data.confidentialityLevel = d.confidentialityLevel;
  if (d.riskTags !== undefined) data.riskTags = d.riskTags;
  if (d.status !== undefined) data.status = d.status;

  const project = await prisma.project.update({ where: { id: params.id }, data });

  if (d.status && d.status !== existing.status) {
    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.PROJECT_STATUS_CHANGE,
      targetType: "PROJECT",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: d.status },
    });

    await eventBus.emit(Events.PROJECT_STATUS_CHANGED, {
      projectId: params.id,
      oldStatus: existing.status,
      newStatus: d.status,
    }, { actorId: admin.session.user?.id });
  }

  return apiOk(project);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, status: true, _count: { select: { deals: true } } },
  });
  if (!project) return apiNotFound("Project");

  const activeDeals = await prisma.deal.count({
    where: { projectId: params.id, stage: { notIn: ["PASSED", "FUNDED"] } },
  });
  if (activeDeals > 0) {
    return apiValidationError([{
      path: "id",
      message: `Cannot delete project with ${activeDeals} active deal(s). Archive or close deals first.`,
    }]);
  }

  await prisma.project.delete({ where: { id: params.id } });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.PROJECT_DELETE,
    targetType: "PROJECT",
    targetId: params.id,
    metadata: { name: project.name, previousStatus: project.status },
  });

  return apiOk({ deleted: true });
}
