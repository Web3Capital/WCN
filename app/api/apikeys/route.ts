import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound, apiForbidden } from "@/lib/core/api-response";
import { createApiKey, revokeApiKey } from "@/lib/modules/apikeys/service";
import { isAdminRole } from "@/lib/permissions";
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
  const userId = auth.session.user!.id;
  const userRole = (auth.session.user as any).role ?? "USER";
  const scopes = parsed.data.scopes ?? ["read"];

  if (scopes.includes("*") && !isAdminRole(userRole)) {
    return apiForbidden("Wildcard scope requires ADMIN role.");
  }

  if (parsed.data.nodeId) {
    const node = await prisma.node.findUnique({
      where: { id: parsed.data.nodeId },
      select: { ownerUserId: true },
    });
    if (!node) {
      return apiNotFound("Node");
    }
    if (node.ownerUserId !== userId && !isAdminRole(userRole)) {
      return apiForbidden("You can only create API keys for nodes you own.");
    }
  }

  const result = await createApiKey(prisma, {
    name: parsed.data.name,
    userId,
    nodeId: parsed.data.nodeId,
    scopes,
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
