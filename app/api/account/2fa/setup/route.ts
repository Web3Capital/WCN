import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { TOTPGenerate } from "@/lib/totp";
import { HttpError, route } from "@/lib/core/api/route";
import { z } from "zod";

export const POST = route.session({
  input: z.object({}),
  rateLimit: "auth",
  handler: async ({ session }) => {
    const prisma = getPrisma();
    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true } });

    if (user?.twoFactorEnabled) {
      throw new HttpError(409, "CONFLICT", "2FA already enabled.");
    }

    const { secret, otpauthUrl } = TOTPGenerate();

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpauthUrl };
  },
});
