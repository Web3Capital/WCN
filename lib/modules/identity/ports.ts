/**
 * @wcn/identity — Port Definitions
 */

export interface UserRecord {
  id: string;
  accountStatus: string;
  lockedAt: Date | null;
  lockReason: string | null;
  failedLoginCount: number;
  tokenInvalidatedAt: Date | null;
  name: string | null;
  image: string | null;
}

export interface IdentityPort {
  findUserById(id: string): Promise<UserRecord | null>;
  updateUser(id: string, data: Record<string, unknown>): Promise<void>;
}
