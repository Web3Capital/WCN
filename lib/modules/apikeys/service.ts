import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";

const KEY_PREFIX_LEN = 8;

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `wcn_${crypto.randomBytes(32).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, KEY_PREFIX_LEN + 4);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createApiKey(
  prisma: PrismaClient,
  opts: {
    name: string;
    userId?: string;
    nodeId?: string;
    scopes?: string[];
    rateLimit?: number;
    expiresInDays?: number;
  },
): Promise<{ key: { id: string; name: string; keyPrefix: string; scopes: string[]; createdAt: Date }; rawKey: string }> {
  const { raw, hash, prefix } = generateApiKey();

  const record = await prisma.apiKey.create({
    data: {
      name: opts.name,
      keyHash: hash,
      keyPrefix: prefix,
      userId: opts.userId,
      nodeId: opts.nodeId,
      scopes: opts.scopes ?? ["read"],
      rateLimit: opts.rateLimit ?? 60,
      expiresAt: opts.expiresInDays
        ? new Date(Date.now() + opts.expiresInDays * 86400000)
        : undefined,
    },
  });

  return {
    key: { id: record.id, name: record.name, keyPrefix: record.keyPrefix, scopes: record.scopes, createdAt: record.createdAt },
    rawKey: raw,
  };
}

export async function validateApiKey(
  prisma: PrismaClient,
  raw: string,
): Promise<{
  valid: boolean;
  keyId?: string;
  userId?: string;
  nodeId?: string;
  scopes?: string[];
  rateLimit?: number;
}> {
  const hash = hashApiKey(raw);

  const key = await prisma.apiKey.findUnique({ where: { keyHash: hash } });

  if (!key) return { valid: false };
  if (key.revokedAt) return { valid: false };
  if (key.expiresAt && key.expiresAt < new Date()) return { valid: false };

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    valid: true,
    keyId: key.id,
    userId: key.userId ?? undefined,
    nodeId: key.nodeId ?? undefined,
    scopes: key.scopes,
    rateLimit: key.rateLimit,
  };
}

export async function revokeApiKey(prisma: PrismaClient, keyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
}

export function hasScope(scopes: string[], required: string): boolean {
  if (scopes.includes("*")) return true;
  if (scopes.includes(required)) return true;
  const [action] = required.split(":");
  return scopes.includes(`${action}:*`);
}
