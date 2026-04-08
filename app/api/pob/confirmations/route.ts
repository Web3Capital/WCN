import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const pobId = String(body?.pobId ?? "").trim();
  const decision = String(body?.decision ?? "").trim();
  const partyType = String(body?.partyType ?? "").trim();
  if (!pobId || !decision || !partyType) {
    return NextResponse.json({ ok: false, error: "Missing pobId/decision/partyType." }, { status: 400 });
  }
  const allowedDecision = new Set(["CONFIRM", "REJECT"]);
  const allowedParty = new Set(["USER", "NODE"]);
  if (!allowedDecision.has(decision) || !allowedParty.has(partyType)) {
    return NextResponse.json({ ok: false, error: "Invalid decision/partyType." }, { status: 400 });
  }

  const confirmation = await prisma.confirmation.create({
    data: {
      targetType: "POB",
      targetId: pobId,
      pobId,
      decision: decision as any,
      notes: body?.notes ? String(body.notes) : null,
      partyType: partyType as any,
      partyUserId: body?.partyUserId ? String(body.partyUserId) : null,
      partyNodeId: body?.partyNodeId ? String(body.partyNodeId) : null
    }
  });

  return NextResponse.json({ ok: true, confirmation });
}

