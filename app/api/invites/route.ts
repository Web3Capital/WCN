import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { createHash, randomBytes } from "crypto";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function GET() {
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { createdBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ ok: true, invites });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const email = String(body?.email ?? "").toLowerCase().trim();
  const role = String(body?.role ?? "NODE_OWNER");
  const expiresInDays = Number(body?.expiresInDays) || 7;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required." }, { status: 400 });
  }

  const existing = await prisma.invite.findFirst({
    where: { email, activatedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Active invite already exists for this email." }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const invite = await prisma.invite.create({
    data: {
      email,
      tokenHash,
      role: role as any,
      expiresAt,
      createdById: auth.session.user!.id,
      workspaceId: body?.workspaceId ?? null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.INVITE_SEND,
    targetType: "INVITE",
    targetId: invite.id,
    metadata: { email, role, expiresAt: expiresAt.toISOString() },
  });

  return NextResponse.json({ ok: true, invite: { ...invite, token: rawToken } });
}
