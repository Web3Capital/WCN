import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body?.name !== undefined) data.name = String(body.name).trim();
  if (body?.sector !== undefined) data.sector = body.sector ? String(body.sector) : null;
  if (body?.website !== undefined) data.website = body.website ? String(body.website) : null;
  if (body?.pitchUrl !== undefined) data.pitchUrl = body.pitchUrl ? String(body.pitchUrl) : null;
  if (body?.fundraisingNeed !== undefined) data.fundraisingNeed = body.fundraisingNeed ? String(body.fundraisingNeed) : null;
  if (body?.contactName !== undefined) data.contactName = body.contactName ? String(body.contactName) : null;
  if (body?.contactEmail !== undefined) data.contactEmail = body.contactEmail ? String(body.contactEmail) : null;
  if (body?.contactTelegram !== undefined) data.contactTelegram = body.contactTelegram ? String(body.contactTelegram) : null;
  if (body?.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body?.nodeId !== undefined) data.nodeId = body.nodeId ? String(body.nodeId) : null;

  if (body?.stage !== undefined) {
    const stage = String(body.stage);
    const allowedStages = new Set(["IDEA", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PUBLIC", "OTHER"]);
    if (!allowedStages.has(stage)) {
      return NextResponse.json({ ok: false, error: "Invalid stage." }, { status: 400 });
    }
    data.stage = stage;
  }

  if (body?.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ARCHIVED"]);
    if (!allowed.has(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }
    data.status = status;
  }

  const project = await prisma.project.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, project });
}

