import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const startAt = body?.startAt ? new Date(String(body.startAt)) : null;
  const endAt = body?.endAt ? new Date(String(body.endAt)) : null;
  const pool = Number(body?.pool ?? 0);
  if (!startAt || !endAt || !Number.isFinite(pool)) {
    return NextResponse.json({ ok: false, error: "Missing/invalid startAt/endAt/pool." }, { status: 400 });
  }

  const approved = await prisma.poBRecord.findMany({
    where: {
      status: "APPROVED",
      createdAt: { gte: startAt, lte: endAt }
    },
    include: { attributions: true }
  });

  const totals = new Map<string, number>();
  for (const pob of approved) {
    for (const attr of pob.attributions) {
      totals.set(attr.nodeId, (totals.get(attr.nodeId) ?? 0) + (pob.score * attr.shareBps) / 10000);
    }
  }
  const networkScore = Array.from(totals.values()).reduce((s, v) => s + v, 0);

  const out = Array.from(totals.entries()).map(([nodeId, scoreTotal]) => ({
    nodeId,
    scoreTotal,
    allocation: networkScore > 0 ? (scoreTotal / networkScore) * pool : 0
  }));
  out.sort((a, b) => b.allocation - a.allocation);

  return NextResponse.json({ ok: true, networkScore, lines: out });
}

