import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { redactSettlementCycleForMember } from "@/lib/member-redact";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = auth.session.user?.role === "ADMIN";

  const cycles = await prisma.settlementCycle.findMany({ orderBy: { startAt: "desc" }, take: 50 });

  return NextResponse.json({
    ok: true,
    cycles: isAdmin ? cycles : cycles.map(redactSettlementCycleForMember)
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const kind = String(body?.kind ?? "MONTH").trim();
  const startAt = body?.startAt ? new Date(String(body.startAt)) : null;
  const endAt = body?.endAt ? new Date(String(body.endAt)) : null;
  const pool = Number(body?.pool ?? 0);
  if (!startAt || !endAt || !Number.isFinite(pool)) {
    return NextResponse.json({ ok: false, error: "Missing/invalid kind/startAt/endAt/pool." }, { status: 400 });
  }
  const allowed = new Set(["WEEK", "MONTH"]);
  if (!allowed.has(kind)) return NextResponse.json({ ok: false, error: "Invalid kind." }, { status: 400 });

  const cycle = await prisma.settlementCycle.create({
    data: {
      kind: kind as any,
      startAt,
      endAt,
      pool
    }
  });
  return NextResponse.json({ ok: true, cycle });
}

