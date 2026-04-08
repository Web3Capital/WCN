import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { TaskStatus } from "@prisma/client";
import { getOwnedNodeIds, memberTasksWhere } from "@/lib/member-data-scope";
import { redactTaskForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = auth.session.user?.role === "ADMIN";
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

  return NextResponse.json({
    ok: true,
    tasks: isAdmin ? tasks : tasks.map((t) => redactTaskForMember(t, userId))
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const title = String(body?.title ?? "").trim();
  const type = String(body?.type ?? "").trim();
  if (!title || !type) {
    return NextResponse.json({ ok: false, error: "Missing title/type." }, { status: 400 });
  }
  const allowedTypes = new Set(["FUNDRAISING", "GROWTH", "RESOURCE", "LIQUIDITY", "RESEARCH", "EXECUTION", "OTHER"]);
  if (!allowedTypes.has(type)) {
    return NextResponse.json({ ok: false, error: "Invalid task type." }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      type: type as any,
      status: body?.status ? (String(body.status) as TaskStatus) : undefined,
      description: body?.description ? String(body.description) : null,
      projectId: body?.projectId ? String(body.projectId) : null,
      ownerNodeId: body?.ownerNodeId ? String(body.ownerNodeId) : null,
      dueAt: body?.dueAt ? new Date(String(body.dueAt)) : null
    }
  });

  const assignNodeIds = Array.isArray(body?.assignNodeIds)
    ? body.assignNodeIds.map((x: any) => String(x)).filter(Boolean)
    : [];

  if (assignNodeIds.length) {
    await prisma.taskAssignment.createMany({
      data: assignNodeIds.map((nodeId: string) => ({ taskId: task.id, nodeId, role: "COLLABORATOR" })),
      skipDuplicates: true
    });
  }

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.TASK_CREATE,
    targetType: "TASK",
    targetId: task.id,
    metadata: { title, type }
  });

  return NextResponse.json({ ok: true, taskId: task.id });
}

