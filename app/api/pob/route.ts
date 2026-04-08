import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ApplicationStatus } from "@prisma/client";

function computeScore(input: {
  baseValue: number;
  weight: number;
  qualityMult: number;
  timeMult: number;
  riskDiscount: number;
}) {
  const base = Number.isFinite(input.baseValue) ? input.baseValue : 0;
  const weight = Number.isFinite(input.weight) ? input.weight : 1;
  const q = Number.isFinite(input.qualityMult) ? input.qualityMult : 1;
  const t = Number.isFinite(input.timeMult) ? input.timeMult : 1;
  const r = Number.isFinite(input.riskDiscount) ? input.riskDiscount : 1;
  return base * weight * q * t * r;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const pob = await prisma.poBRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { task: true, project: true, node: true }
  });

  return NextResponse.json({ ok: true, pob });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const businessType = String(body?.businessType ?? "").trim();
  if (!businessType) {
    return NextResponse.json({ ok: false, error: "Missing businessType." }, { status: 400 });
  }

  const baseValue = Number(body?.baseValue ?? 0);
  const weight = Number(body?.weight ?? 1);
  const qualityMult = Number(body?.qualityMult ?? 1);
  const timeMult = Number(body?.timeMult ?? 1);
  const riskDiscount = Number(body?.riskDiscount ?? 1);

  const score = computeScore({ baseValue, weight, qualityMult, timeMult, riskDiscount });

  const record = await prisma.poBRecord.create({
    data: {
      businessType,
      baseValue,
      weight,
      qualityMult,
      timeMult,
      riskDiscount,
      score,
      status: body?.status ? (String(body.status) as ApplicationStatus) : undefined,
      notes: body?.notes ? String(body.notes) : null,
      taskId: body?.taskId ? String(body.taskId) : null,
      projectId: body?.projectId ? String(body.projectId) : null,
      nodeId: body?.nodeId ? String(body.nodeId) : null
    }
  });

  return NextResponse.json({ ok: true, record });
}

