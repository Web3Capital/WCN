import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { TOTPVerify } from "@/lib/totp";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const userId = auth.session.user!.id;
  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim();

  if (!code || code.length !== 6) {
    return NextResponse.json({ ok: false, error: "6-digit code required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true, accountStatus: true },
  });

  if (!user?.twoFactorSecret) {
    return NextResponse.json({ ok: false, error: "Run 2FA setup first." }, { status: 400 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ ok: false, error: "2FA already enabled." }, { status: 409 });
  }

  if (!TOTPVerify(user.twoFactorSecret, code)) {
    return NextResponse.json({ ok: false, error: "Invalid code." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      accountStatus: user.accountStatus === "PENDING_2FA" ? "ACTIVE" : user.accountStatus,
    },
  });

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.TWO_FACTOR_ENABLE,
    targetType: "USER",
    targetId: userId,
    metadata: {},
  });

  return NextResponse.json({ ok: true, message: "2FA enabled successfully." });
}
