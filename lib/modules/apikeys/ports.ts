/**
 * @wcn/apikeys — Port Definitions
 */

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  userId: string | null;
  nodeId: string | null;
  scopes: string[];
  rateLimit: number;
  revokedAt: Date | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyPort {
  create(data: { name: string; keyHash: string; keyPrefix: string; userId?: string; nodeId?: string; scopes: string[]; rateLimit: number; expiresAt?: Date }): Promise<ApiKeyRecord>;
  findByHash(hash: string): Promise<ApiKeyRecord | null>;
  updateLastUsed(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
}
