import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { z } from "zod";
import { parseBody } from "@/lib/core/validation";

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().max(500).optional(),
}).refine((d) => d.name !== undefined || d.image !== undefined, {
  message: "At least one field required",
});

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      accountStatus: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { nodes: true, applications: true } },
    },
  });

  return apiOk(user);
}

export async function PATCH(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(profileSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const userId = auth.session.user.id;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, name: true, email: true, image: true },
  });

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.USER_STATUS_CHANGE,
    targetType: "USER",
    targetId: userId,
    metadata: { action: "profile_update", fields: Object.keys(parsed.data) },
  });

  return apiOk(updated);
}
