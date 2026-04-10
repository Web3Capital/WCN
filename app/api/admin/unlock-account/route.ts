import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Email is required" } },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, accountStatus: true, failedLoginCount: true, lockedAt: true, lockReason: true },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 },
    );
  }

  if (user.accountStatus !== "LOCKED") {
    return NextResponse.json({
      ok: true,
      data: {
        email: user.email,
        accountStatus: user.accountStatus,
        failedLoginCount: user.failedLoginCount,
        message: "Account is not locked",
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accountStatus: "ACTIVE",
      failedLoginCount: 0,
      lockedAt: null,
      lockReason: null,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      email: user.email,
      previousStatus: "LOCKED",
      newStatus: "ACTIVE",
      failedLoginCount: 0,
      message: "Account unlocked successfully",
    },
  });
}
