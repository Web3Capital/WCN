import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import bcrypt from "bcryptjs";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiValidationError, zodToApiError } from "@/lib/core/api-response";
import { parseBody, changePasswordSchema } from "@/lib/core/validation";

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(changePasswordSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const userId = auth.session.user!.id;
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash) {
    return apiValidationError([{ path: "currentPassword", message: "No password set." }]);
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return apiUnauthorized("Current password incorrect.");

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.PASSWORD_CHANGE,
    targetType: "USER",
    targetId: userId,
    metadata: {},
  });

  return apiOk({ message: "Password updated." });
}
