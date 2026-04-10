import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiConflict, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createInviteSchema } from "@/lib/core/validation";
import { createHash, randomBytes } from "crypto";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function GET() {
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { createdBy: { select: { name: true, email: true } } },
  });

  return apiOk(invites);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createInviteSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { email, role, expiresInDays, workspaceId } = parsed.data;

  const existing = await prisma.invite.findFirst({
    where: { email, activatedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existing) return apiConflict("Active invite already exists for this email.");

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
      workspaceId: workspaceId ?? null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.INVITE_SEND,
    targetType: "INVITE",
    targetId: invite.id,
    metadata: { email, role, expiresAt: expiresAt.toISOString() },
  });

  return apiOk({ ...invite, token: rawToken });
}
