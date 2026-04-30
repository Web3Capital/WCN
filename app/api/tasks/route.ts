import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { TaskStatus } from "@prisma/client";
import { getOwnedNodeIds, memberTasksWhere } from "@/lib/member-data-scope";
import { redactTaskForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createTaskSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;

  const where = isAdmin ? {} : memberTasksWhere(await getOwnedNodeIds(prisma, userId));

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      project: { include: { node: true } },
      ownerNode: true,
      assignments: { include: { node: true } }
    }
  });

  return apiOk(isAdmin ? tasks : tasks.map((t) => redactTaskForMember(t, userId)));
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "task");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createTaskSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const input = parsed.data;
  const raw = body as Record<string, unknown>;
  const status = raw?.status ? (String(raw.status) as TaskStatus) : undefined;

  // Row-level: non-admin can only create tasks where ownerNode and any
  // assigned nodes are in their owned set. Otherwise NODE_OWNER could
  // create work on someone else's node.
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
    if (input.ownerNodeId && !ownedNodeIds.includes(input.ownerNodeId)) {
      return apiUnauthorized();
    }
    const assigns = input.assignNodeIds ?? [];
    if (assigns.some((id) => !ownedNodeIds.includes(id))) {
      return apiUnauthorized();
    }
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      type: input.type,
      status,
      description: input.description ?? null,
      projectId: input.projectId ?? null,
      ownerNodeId: input.ownerNodeId ?? null,
      dealId: input.dealId ?? null,
      assigneeUserId: input.assigneeUserId ?? null,
      acceptanceOwner: input.acceptanceOwner ?? null,
      evidenceRequired: input.evidenceRequired,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    }
  });

  const assignNodeIds = input.assignNodeIds;
  if (assignNodeIds.length) {
    await prisma.taskAssignment.createMany({
      data: assignNodeIds.map((nodeId: string) => ({ taskId: task.id, nodeId, role: "COLLABORATOR" })),
      skipDuplicates: true
    });
  }

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.TASK_CREATE,
    targetType: "TASK",
    targetId: task.id,
    metadata: { title: input.title, type: input.type }
  });

  await eventBus.emit(
    Events.TASK_CREATED,
    { taskId: task.id, dealId: task.dealId ?? undefined, title: task.title },
    { actorId: auth.session.user?.id }
  );

  return apiCreated({ taskId: task.id });
}
