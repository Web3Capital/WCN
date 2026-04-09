import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { canTransitionTask } from "@/lib/state-machines/task";
import { AuditAction, writeAudit } from "@/lib/audit";
import type { TaskStatus } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true, status: true } },
      ownerNode: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, stage: true } },
      assignments: { include: { node: { select: { id: true, name: true } } } },
      evidences: { select: { id: true, title: true, type: true, reviewStatus: true, createdAt: true }, take: 30, orderBy: { createdAt: "desc" } },
      pobRecords: { select: { id: true, businessType: true, status: true, score: true }, take: 10 },
      agentRuns: { select: { id: true, status: true, cost: true, startedAt: true, finishedAt: true }, take: 10, orderBy: { startedAt: "desc" } },
    },
  });

  if (!task) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  return NextResponse.json({ ok: true, task });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.task.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body?.title !== undefined) data.title = String(body.title).trim();
  if (body?.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body?.projectId !== undefined) data.projectId = body.projectId ? String(body.projectId) : null;
  if (body?.ownerNodeId !== undefined) data.ownerNodeId = body.ownerNodeId ? String(body.ownerNodeId) : null;
  if (body?.dealId !== undefined) data.dealId = body.dealId ? String(body.dealId) : null;
  if (body?.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;
  if (body?.assigneeUserId !== undefined) data.assigneeUserId = body.assigneeUserId ? String(body.assigneeUserId) : null;
  if (body?.acceptanceOwner !== undefined) data.acceptanceOwner = body.acceptanceOwner ? String(body.acceptanceOwner) : null;
  if (body?.evidenceRequired !== undefined) {
    data.evidenceRequired = Array.isArray(body.evidenceRequired) ? body.evidenceRequired.map((s: unknown) => String(s)) : [];
  }

  if (body?.type !== undefined) {
    const type = String(body.type);
    const allowedTypes = new Set(["FUNDRAISING", "GROWTH", "RESOURCE", "LIQUIDITY", "RESEARCH", "EXECUTION", "OTHER"]);
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ ok: false, error: "Invalid task type." }, { status: 400 });
    }
    data.type = type;
  }

  if (body?.status !== undefined) {
    const newStatus = String(body.status) as TaskStatus;
    if (!canTransitionTask(existing.status, newStatus)) {
      return NextResponse.json({
        ok: false,
        error: `Cannot transition from ${existing.status} to ${newStatus}.`,
      }, { status: 400 });
    }
    data.status = newStatus;
  }

  const task = await prisma.task.update({ where: { id: params.id }, data });

  if (Array.isArray(body?.assignNodeIds)) {
    const ids = body.assignNodeIds.map((x: unknown) => String(x)).filter(Boolean);
    await prisma.taskAssignment.deleteMany({ where: { taskId: task.id } });
    if (ids.length) {
      await prisma.taskAssignment.createMany({
        data: ids.map((nodeId: string) => ({ taskId: task.id, nodeId, role: "COLLABORATOR" })),
        skipDuplicates: true,
      });
    }
  }

  if (data.status && data.status !== existing.status) {
    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.TASK_STATUS_CHANGE,
      targetType: "TASK",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: data.status },
    });
  }

  return NextResponse.json({ ok: true, task });
}
