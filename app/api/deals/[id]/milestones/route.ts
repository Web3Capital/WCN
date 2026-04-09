import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ ok: false, error: "Title required." }, { status: 400 });

  const milestone = await prisma.dealMilestone.create({
    data: {
      dealId: params.id,
      title,
      dueAt: body?.dueAt ? new Date(String(body.dueAt)) : null,
    },
  });

  return NextResponse.json({ ok: true, milestone });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const milestoneId = String(body?.milestoneId ?? "");
  if (!milestoneId) return NextResponse.json({ ok: false, error: "milestoneId required." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body?.title !== undefined) data.title = String(body.title);
  if (body?.doneAt !== undefined) data.doneAt = body.doneAt ? new Date(String(body.doneAt)) : null;
  if (body?.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;

  const milestone = await prisma.dealMilestone.update({ where: { id: milestoneId }, data });

  return NextResponse.json({ ok: true, milestone });
}
