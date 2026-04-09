import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { TOTPGenerate } from "@/lib/totp";

export async function POST() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const userId = auth.session.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true } });

  if (user?.twoFactorEnabled) {
    return NextResponse.json({ ok: false, error: "2FA already enabled." }, { status: 409 });
  }

  const { secret, otpauthUrl } = TOTPGenerate();

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return NextResponse.json({ ok: true, secret, otpauthUrl });
}
