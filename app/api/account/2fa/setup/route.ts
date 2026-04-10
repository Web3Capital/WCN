import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { TOTPGenerate } from "@/lib/totp";
import { apiOk, apiUnauthorized, apiConflict } from "@/lib/core/api-response";

export async function POST() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const userId = auth.session.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true } });

  if (user?.twoFactorEnabled) {
    return apiConflict("2FA already enabled.");
  }

  const { secret, otpauthUrl } = TOTPGenerate();

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return apiOk({ secret, otpauthUrl });
}
