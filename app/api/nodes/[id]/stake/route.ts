import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";

const ALLOWED_ACTIONS = new Set(["DEPOSIT", "WITHDRAW", "FREEZE", "UNFREEZE", "SLASH"]);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  if (!isAdmin) {
    const node = await prisma.node.findUnique({ where: { id: params.id }, select: { ownerUserId: true } });
    if (node?.ownerUserId !== auth.session.user!.id) {
      return NextResponse.json({ ok: false, error: "Access denied." }, { status: 403 });
    }
  }

  const entries = await prisma.stakeLedger.findMany({
    where: { nodeId: params.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ ok: true, entries });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const action = String(body?.action ?? "").trim();
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: "Invalid action. Must be DEPOSIT, WITHDRAW, FREEZE, UNFREEZE, or SLASH." }, { status: 400 });
  }

  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ ok: false, error: "Invalid amount." }, { status: 400 });
  }

  const entry = await prisma.stakeLedger.create({
    data: {
      nodeId: params.id,
      action: action as any,
      amount,
      notes: body?.notes ? String(body.notes) : null,
      metadata: body?.metadata ?? null
    }
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.STAKE_ACTION,
    targetType: "STAKE_LEDGER",
    targetId: entry.id,
    metadata: { nodeId: params.id, stakeAction: action, amount }
  });

  return NextResponse.json({ ok: true, entry });
}
