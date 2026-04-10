import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { z } from "zod";

const walletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  chain: z.enum(["polygon", "base", "ethereum"]).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requirePermission("read", "node");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const config = await prisma.paymentConfig.findUnique({ where: { nodeId: id } });
  if (!config) return apiNotFound("Wallet config");

  return apiOk(config);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = walletSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const node = await prisma.node.findUnique({ where: { id } });
  if (!node) return apiNotFound("Node");

  const config = await prisma.paymentConfig.upsert({
    where: { nodeId: id },
    create: { nodeId: id, walletAddress: parsed.data.walletAddress, chain: parsed.data.chain ?? "polygon" },
    update: { walletAddress: parsed.data.walletAddress, chain: parsed.data.chain ?? "polygon" },
  });

  return apiOk(config);
}
