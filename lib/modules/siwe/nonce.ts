/**
 * SIWE nonce store. Issues one-time, time-bound nonces and atomically consumes
 * them on verify. Without this, a captured signature would be replayable forever.
 *
 * Storage: Upstash Redis (production). In dev without Redis, falls back to an
 * in-memory map — single-process only, NOT safe for multi-instance deployments.
 * Production deployments MUST have UPSTASH_REDIS_REST_URL set.
 */

import { generateNonce } from "siwe";
import { getRedis } from "@/lib/redis";

const TTL_SECONDS = 5 * 60; // 5 minutes — long enough for a sign flow, short enough to bound replay window
const KEY_PREFIX = "wcn:siwe:nonce:";

// Dev-only fallback. Each entry stores (nonce → expiresAtMs).
const memoryStore = new Map<string, number>();

function memoryGet(nonce: string): boolean {
  const exp = memoryStore.get(nonce);
  if (!exp) return false;
  if (Date.now() > exp) {
    memoryStore.delete(nonce);
    return false;
  }
  return true;
}

function memoryDelete(nonce: string) {
  memoryStore.delete(nonce);
}

function memoryPut(nonce: string) {
  memoryStore.set(nonce, Date.now() + TTL_SECONDS * 1000);
  // opportunistic cleanup
  if (memoryStore.size > 1000) {
    const now = Date.now();
    for (const [k, v] of memoryStore) if (v < now) memoryStore.delete(k);
  }
}

/**
 * Issues a fresh nonce and stores it. Caller must include this nonce in the
 * SiweMessage they ask the wallet to sign.
 */
export async function issueNonce(): Promise<string> {
  const nonce = generateNonce();
  const redis = getRedis();
  if (redis) {
    await redis.set(`${KEY_PREFIX}${nonce}`, "1", { ex: TTL_SECONDS });
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SIWE nonce store unavailable in production. Set UPSTASH_REDIS_REST_URL.");
    }
    memoryPut(nonce);
  }
  return nonce;
}

/**
 * Atomically consumes a nonce. Returns true on first call, false on every
 * subsequent call (replay) or if the nonce was never issued / expired.
 *
 * Atomicity: uses Redis DEL which returns the number of keys removed (1 means
 * we won the race). Without this, two concurrent verifies of the same nonce
 * could both succeed.
 */
export async function consumeNonce(nonce: string): Promise<boolean> {
  if (!nonce || typeof nonce !== "string") return false;
  const redis = getRedis();
  if (redis) {
    const key = `${KEY_PREFIX}${nonce}`;
    const removed = await redis.del(key);
    return removed === 1;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SIWE nonce store unavailable in production. Set UPSTASH_REDIS_REST_URL.");
  }
  const ok = memoryGet(nonce);
  if (ok) memoryDelete(nonce);
  return ok;
}

// Test-only: clear the in-memory fallback. Not exported via index.
export function __resetMemoryStoreForTests() {
  memoryStore.clear();
}
