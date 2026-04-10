import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound } from "@/lib/core/api-response";
import { createApiKey, revokeApiKey } from "@/lib/modules/apikeys/service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  nodeId: z.string().optional(),
  scopes: z.array(z.string()).min(1).optional(),
  rateLimit: z.number().int().min(1).max(1000).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const keys = await prisma.apiKey.findMany({
    where: { userId: auth.session.user!.id, revokedAt: null },
    select: { id: true, name: true, keyPrefix: true, scopes: true, rateLimit: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(keys);
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const result = await createApiKey(prisma, {
    name: parsed.data.name,
    userId: auth.session.user!.id,
    nodeId: parsed.data.nodeId,
    scopes: parsed.data.scopes ?? ["read"],
    rateLimit: parsed.data.rateLimit,
    expiresInDays: parsed.data.expiresInDays,
  });

  return apiOk({ ...result.key, rawKey: result.rawKey });
}

export async function DELETE(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("id");
  if (!keyId) return apiValidationError([{ path: "id", message: "Key ID required" }]);

  const prisma = getPrisma();
  const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
  if (!key || key.userId !== auth.session.user!.id) return apiNotFound("API Key");

  await revokeApiKey(prisma, keyId);
  return apiOk({ revoked: true });
}
