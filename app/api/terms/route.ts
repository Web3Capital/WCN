import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const acceptances = await prisma.termsAcceptance.findMany({
    where: { userId: session.user.id },
    orderBy: { acceptedAt: "desc" },
  });

  return NextResponse.json({ ok: true, acceptances });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const documentType = String(body?.documentType ?? "");
  const documentVer = String(body?.documentVer ?? "1.0");

  if (!["NDA", "TERMS", "PRIVACY", "CODE_OF_CONDUCT"].includes(documentType)) {
    return NextResponse.json({ ok: false, error: "Invalid documentType." }, { status: 400 });
  }

  const existing = await prisma.termsAcceptance.findFirst({
    where: { userId: session.user.id, documentType: documentType as any, documentVer },
  });
  if (existing) {
    return NextResponse.json({ ok: true, acceptance: existing, alreadyAccepted: true });
  }

  const acceptance = await prisma.termsAcceptance.create({
    data: {
      userId: session.user.id,
      documentType: documentType as any,
      documentVer,
      workspaceId: body?.workspaceId ?? null,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
      deviceInfo: req.headers.get("user-agent") ?? null,
    },
  });

  await writeAudit({
    actorUserId: session.user.id,
    action: AuditAction.TERMS_ACCEPT,
    targetType: "TERMS",
    targetId: acceptance.id,
    metadata: { documentType, documentVer },
  });

  return NextResponse.json({ ok: true, acceptance }, { status: 201 });
}
