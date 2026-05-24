import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { createInviteSchema } from "@/lib/core/validation";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export const GET = route.permission({
  input: z.object({}),
  rateLimit: "auth",
  permission: { action: "read", resource: "invite" },
  handler: async () => {
    const prisma = getPrisma();
    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { createdBy: { select: { name: true, email: true } } },
    });

    return invites;
  },
});

export const POST = route.permission({
  input: createInviteSchema,
  rateLimit: "write",
  permission: { action: "create", resource: "invite" },
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const { email, role, expiresInDays, workspaceId } = input;

    const existing = await prisma.invite.findFirst({
      where: { email, activatedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existing) throw new HttpError(409, "CONFLICT", "Active invite already exists for this email.");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const invite = await prisma.invite.create({
      data: {
        email,
        tokenHash,
        role: role as Role,
        expiresAt,
        createdById: session.user.id,
        workspaceId: workspaceId ?? null,
      },
    });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.INVITE_SEND,
      targetType: "INVITE",
      targetId: invite.id,
      metadata: { email, role, expiresAt: expiresAt.toISOString() },
    });

    return { ...invite, token: rawToken };
  },
});
