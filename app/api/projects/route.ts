import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { ProjectStatus } from "@prisma/client";
import { getOwnedNodeIds, memberProjectsWhere } from "@/lib/member-data-scope";
import { redactProjectForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createProjectSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;

  const where = isAdmin ? {} : memberProjectsWhere(await getOwnedNodeIds(prisma, userId));

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { node: true },
  });

  return apiOk({
    projects: isAdmin ? projects : projects.map((p) => redactProjectForMember(p, userId)),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createProjectSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const d = parsed.data;
  const project = await prisma.project.create({
    data: {
      name: d.name,
      status: d.status ? (d.status as ProjectStatus) : undefined,
      stage: d.stage as any,
      sector: d.sector ?? null,
      website: d.website ?? null,
      pitchUrl: d.pitchUrl ?? null,
      fundraisingNeed: d.fundraisingNeed ?? null,
      contactName: d.contactName ?? null,
      contactEmail: d.contactEmail ?? null,
      contactTelegram: d.contactTelegram ?? null,
      description: d.description ?? null,
      nodeId: d.nodeId ?? null,
    },
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.PROJECT_CREATE,
    targetType: "PROJECT",
    targetId: project.id,
    metadata: { name: d.name, stage: d.stage },
  });

  await eventBus.emit(
    Events.PROJECT_CREATED,
    {
      projectId: project.id,
      nodeId: project.nodeId ?? undefined,
      name: project.name,
      sector: project.sector ?? undefined,
      stage: project.stage,
    },
    { actorId: admin.session.user?.id },
  );

  return apiCreated(project);
}
