import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const sessions = await prisma.session.findMany({
    where: { userId: auth.session.user!.id },
    orderBy: { expires: "desc" },
    select: { id: true, expires: true, deviceInfo: true, ipAddress: true },
  });

  return NextResponse.json({ ok: true, sessions });
}

export async function DELETE() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const userId = auth.session.user!.id;

  const { count } = await prisma.session.deleteMany({ where: { userId } });

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.SESSION_REVOKE_ALL,
    targetType: "USER",
    targetId: userId,
    metadata: { sessionsRevoked: count },
  });

  return NextResponse.json({ ok: true, revoked: count });
}
