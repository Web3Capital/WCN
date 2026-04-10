/**
 * Rate limiter using Upstash's sliding window algorithm.
 *
 * Falls back to no-op when Redis is not configured.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const noopResult: RateLimitResult = { success: true, limit: 0, remaining: 0, reset: 0 };

let _apiLimiter: Ratelimit | null = null;
let _authLimiter: Ratelimit | null = null;
let _adminLimiter: Ratelimit | null = null;

function getApiLimiter(): Ratelimit | null {
  if (_apiLimiter) return _apiLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _apiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "wcn:rl:api",
  });
  return _apiLimiter;
}

function getAuthLimiter(): Ratelimit | null {
  if (_authLimiter) return _authLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "wcn:rl:auth",
  });
  return _authLimiter;
}

function getAdminLimiter(): Ratelimit | null {
  if (_adminLimiter) return _adminLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _adminLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "wcn:rl:admin",
  });
  return _adminLimiter;
}

async function check(limiter: Ratelimit | null, identifier: string): Promise<RateLimitResult> {
  if (!limiter) return noopResult;
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    return noopResult;
  }
}

export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  return check(getApiLimiter(), identifier);
}

export async function rateLimitAuth(identifier: string): Promise<RateLimitResult> {
  return check(getAuthLimiter(), identifier);
}

export async function rateLimitAdmin(identifier: string): Promise<RateLimitResult> {
  return check(getAdminLimiter(), identifier);
}
