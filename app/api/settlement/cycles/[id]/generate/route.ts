import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();

  const cycle = await prisma.settlementCycle.findUnique({ where: { id: params.id } });
  if (!cycle) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const approved = await prisma.poBRecord.findMany({
    where: {
      status: "APPROVED",
      createdAt: { gte: cycle.startAt, lte: cycle.endAt }
    },
    include: { attributions: true }
  });

  const totals = new Map<string, { scoreTotal: number; pobCount: number }>();
  for (const pob of approved) {
    for (const attr of pob.attributions) {
      const share = (pob.score * attr.shareBps) / 10000;
      const cur = totals.get(attr.nodeId) ?? { scoreTotal: 0, pobCount: 0 };
      cur.scoreTotal += share;
      cur.pobCount += 1;
      totals.set(attr.nodeId, cur);
    }
  }

  const networkScore = Array.from(totals.values()).reduce((s, v) => s + v.scoreTotal, 0);
  await prisma.settlementLine.deleteMany({ where: { cycleId: cycle.id } });

  const data = Array.from(totals.entries()).map(([nodeId, v]) => ({
    cycleId: cycle.id,
    nodeId,
    scoreTotal: v.scoreTotal,
    pobCount: v.pobCount,
    allocation: networkScore > 0 ? (v.scoreTotal / networkScore) * cycle.pool : 0
  }));

  if (data.length) {
    await prisma.settlementLine.createMany({ data });
  }

  const lines = await prisma.settlementLine.findMany({
    where: { cycleId: cycle.id },
    orderBy: { allocation: "desc" },
    include: { node: true }
  });

  return NextResponse.json({ ok: true, cycle, networkScore, lines });
}

