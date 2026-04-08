import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const pobId = String(body?.pobId ?? "").trim();
  const items = Array.isArray(body?.items) ? body.items : null;
  if (!pobId || !items) {
    return NextResponse.json({ ok: false, error: "Missing pobId/items." }, { status: 400 });
  }

  const cleaned = items
    .map((it: any) => ({
      nodeId: String(it?.nodeId ?? "").trim(),
      shareBps: Number(it?.shareBps ?? 0),
      role: String(it?.role ?? "COLLAB").trim(),
      evidenceRefs: Array.isArray(it?.evidenceRefs) ? it.evidenceRefs.map((x: any) => String(x)) : []
    }))
    .filter((it: any) => it.nodeId && Number.isFinite(it.shareBps) && it.shareBps > 0);

  const total = cleaned.reduce((sum: number, it: any) => sum + it.shareBps, 0);
  if (total !== 10000) {
    return NextResponse.json({ ok: false, error: "shareBps total must equal 10000." }, { status: 400 });
  }

  await prisma.attribution.deleteMany({ where: { pobId } });
  await prisma.attribution.createMany({
    data: cleaned.map((it: any) => ({
      pobId,
      nodeId: it.nodeId,
      shareBps: Math.floor(it.shareBps),
      role: it.role === "LEAD" ? "LEAD" : "COLLAB",
      evidenceRefs: it.evidenceRefs
    }))
  });

  const attributions = await prisma.attribution.findMany({ where: { pobId }, include: { node: true } });
  return NextResponse.json({ ok: true, attributions });
}

