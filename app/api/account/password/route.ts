import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import bcrypt from "bcryptjs";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const userId = auth.session.user!.id;
  const body = await req.json().catch(() => ({}));

  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) {
    return NextResponse.json({ ok: false, error: "No password set." }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Current password incorrect." }, { status: 401 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.PASSWORD_CHANGE,
    targetType: "USER",
    targetId: userId,
    metadata: {},
  });

  return NextResponse.json({ ok: true, message: "Password updated." });
}
