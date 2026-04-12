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
const failClosedResult: RateLimitResult = { success: false, limit: 0, remaining: 0, reset: 0 };

let _apiLimiter: Ratelimit | null = null;
let _authLimiter: Ratelimit | null = null;
let _adminLimiter: Ratelimit | null = null;
let _smsLimiter: Ratelimit | null = null;

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

async function check(limiter: Ratelimit | null, identifier: string, failClosed = false): Promise<RateLimitResult> {
  if (!limiter) {
    if (process.env.NODE_ENV === "production" && failClosed) return failClosedResult;
    if (process.env.NODE_ENV === "production") {
      console.warn("[rate-limit] Upstash Redis not configured in production — rate limiting disabled for this request");
    }
    return noopResult;
  }
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    if (process.env.NODE_ENV === "production" && failClosed) return failClosedResult;
    return noopResult;
  }
}

export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  return check(getApiLimiter(), identifier, false);
}

export async function rateLimitAuth(identifier: string): Promise<RateLimitResult> {
  return check(getAuthLimiter(), identifier, true);
}

export async function rateLimitAdmin(identifier: string): Promise<RateLimitResult> {
  return check(getAdminLimiter(), identifier, false);
}

function getSmsLimiter(): Ratelimit | null {
  if (_smsLimiter) return _smsLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _smsLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "wcn:rl:sms",
  });
  return _smsLimiter;
}

/** 3 SMS per phone per hour — fail-closed in production. */
export async function rateLimitSms(phone: string): Promise<RateLimitResult> {
  return check(getSmsLimiter(), `sms:${phone}`, true);
}
