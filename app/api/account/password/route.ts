import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { changePasswordSchema } from "@/lib/core/validation";

export const POST = route.session({
  input: changePasswordSchema,
  rateLimit: "write",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const userId = session.user.id;
    const { currentPassword, newPassword } = input;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user?.passwordHash) {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid input.", [
        { path: "currentPassword", message: "No password set." },
      ]);
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new HttpError(401, "UNAUTHORIZED", "Current password incorrect.");

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

    await writeAudit({
      actorUserId: userId,
      action: AuditAction.PASSWORD_CHANGE,
      targetType: "USER",
      targetId: userId,
      metadata: {},
    });

    return { message: "Password updated." };
  },
});
