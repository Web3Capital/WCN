import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body?.title !== undefined) data.title = String(body.title).trim();
  if (body?.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body?.projectId !== undefined) data.projectId = body.projectId ? String(body.projectId) : null;
  if (body?.ownerNodeId !== undefined) data.ownerNodeId = body.ownerNodeId ? String(body.ownerNodeId) : null;
  if (body?.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;

  if (body?.type !== undefined) {
    const type = String(body.type);
    const allowedTypes = new Set(["FUNDRAISING", "GROWTH", "RESOURCE", "LIQUIDITY", "RESEARCH", "EXECUTION", "OTHER"]);
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ ok: false, error: "Invalid task type." }, { status: 400 });
    }
    data.type = type;
  }

  if (body?.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(["OPEN", "IN_PROGRESS", "WAITING_REVIEW", "DONE", "CANCELLED"]);
    if (!allowed.has(status)) {
      return NextResponse.json({ ok: false, error: "Invalid task status." }, { status: 400 });
    }
    data.status = status;
  }

  const task = await prisma.task.update({ where: { id: params.id }, data });

  if (Array.isArray(body?.assignNodeIds)) {
    const ids = body.assignNodeIds.map((x: any) => String(x)).filter(Boolean);
    await prisma.taskAssignment.deleteMany({ where: { taskId: task.id } });
    if (ids.length) {
      await prisma.taskAssignment.createMany({
        data: ids.map((nodeId: string) => ({ taskId: task.id, nodeId, role: "COLLABORATOR" })),
        skipDuplicates: true
      });
    }
  }

  return NextResponse.json({ ok: true, task });
}

