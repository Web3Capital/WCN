import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { TOTPVerify } from "@/lib/totp";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiConflict, apiValidationError, zodToApiError } from "@/lib/core/api-response";
import { parseBody, verify2FASchema } from "@/lib/core/validation";

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(verify2FASchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const userId = auth.session.user!.id;
  const { code } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true, accountStatus: true },
  });

  if (!user?.twoFactorSecret) {
    return apiValidationError([{ path: "code", message: "Run 2FA setup first." }]);
  }
  if (user.twoFactorEnabled) {
    return apiConflict("2FA already enabled.");
  }

  if (!TOTPVerify(user.twoFactorSecret, code)) {
    return apiUnauthorized("Invalid code.");
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

  return apiOk({ message: "2FA enabled successfully." });
}
