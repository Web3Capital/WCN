import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ProjectStatus } from "@prisma/client";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { node: true }
  });

  return NextResponse.json({ ok: true, projects });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Missing name." }, { status: 400 });
  }

  const stage = body?.stage ? String(body.stage) : "OTHER";
  const allowedStages = new Set(["IDEA", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PUBLIC", "OTHER"]);
  if (!allowedStages.has(stage)) {
    return NextResponse.json({ ok: false, error: "Invalid stage." }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      status: body?.status ? (String(body.status) as ProjectStatus) : undefined,
      stage: stage as any,
      sector: body?.sector ? String(body.sector) : null,
      website: body?.website ? String(body.website) : null,
      pitchUrl: body?.pitchUrl ? String(body.pitchUrl) : null,
      fundraisingNeed: body?.fundraisingNeed ? String(body.fundraisingNeed) : null,
      contactName: body?.contactName ? String(body.contactName) : null,
      contactEmail: body?.contactEmail ? String(body.contactEmail) : null,
      contactTelegram: body?.contactTelegram ? String(body.contactTelegram) : null,
      description: body?.description ? String(body.description) : null,
      nodeId: body?.nodeId ? String(body.nodeId) : null
    }
  });

  return NextResponse.json({ ok: true, project });
}

