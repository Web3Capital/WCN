import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { TOTPVerify } from "@/lib/totp";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { verify2FASchema } from "@/lib/core/validation";

export const POST = route.session({
  input: verify2FASchema,
  rateLimit: "auth",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const userId = session.user.id;
    const { code } = input;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true, accountStatus: true },
    });

    if (!user?.twoFactorSecret) {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid input.", [
        { path: "code", message: "Run 2FA setup first." },
      ]);
    }
    if (user.twoFactorEnabled) {
      throw new HttpError(409, "CONFLICT", "2FA already enabled.");
    }

    if (!TOTPVerify(user.twoFactorSecret, code)) {
      throw new HttpError(401, "UNAUTHORIZED", "Invalid code.");
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

    return { message: "2FA enabled successfully." };
  },
});
