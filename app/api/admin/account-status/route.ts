import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      accountStatus: true,
      failedLoginCount: true,
      lockedAt: true,
      lockReason: true,
      lastLoginAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" });
  }

  return NextResponse.json({
    ok: true,
    data: {
      email: user.email,
      accountStatus: user.accountStatus,
      failedLoginCount: user.failedLoginCount,
      lockedAt: user.lockedAt,
      lockReason: user.lockReason,
      lastLoginAt: user.lastLoginAt,
      hasPassword: !!user.passwordHash,
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase().trim();
  const action = body?.action;

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  if (action === "unlock") {
    await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: "ACTIVE", failedLoginCount: 0, lockedAt: null, lockReason: null },
    });
    return NextResponse.json({ ok: true, message: "Account unlocked" });
  }

  if (action === "reset-password") {
    const { default: bcrypt } = await import("bcryptjs");
    const newPassword = body?.newPassword;
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, failedLoginCount: 0, accountStatus: "ACTIVE", lockedAt: null, lockReason: null },
    });
    return NextResponse.json({ ok: true, message: "Password reset and account unlocked" });
  }

  return NextResponse.json({ ok: false, error: "Unknown action. Use 'unlock' or 'reset-password'" }, { status: 400 });
}
