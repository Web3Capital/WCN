/**
 * Redis client singleton (Upstash REST-based, serverless-friendly).
 *
 * Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, falling back to the
 * KV_REST_API_URL / KV_REST_API_TOKEN names injected by Vercel's "Upstash for
 * Redis" Marketplace integration (same Upstash REST endpoint + token).
 * Returns null if not configured (graceful fallback in dev).
 */

import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}
