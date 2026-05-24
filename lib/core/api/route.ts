/**
 * Typed API route builder — single entry point for all `app/api/**` routes.
 *
 * See `docs/architecture/adr/0005-api-platform-layer.md` for the full design.
 *
 * Goals:
 *   1. Make Zod input validation **compiler-enforced** (TS error if omitted).
 *   2. Make rate-limit profile selection **compiler-enforced**.
 *   3. Standardize auth + permission + row-scope + audit + error shape.
 *   4. Coexist with legacy hand-written `export async function POST(...)`
 *      handlers; migration is gradual (see Q2 roadmap).
 *
 * Usage examples:
 *
 *   export const POST = route.session({
 *     input: z.object({ name: z.string() }),
 *     rateLimit: 'write',
 *     handler: async ({ input, session }) => ({ id: '...' }),
 *   });
 *
 *   export const PATCH = route.permission({
 *     input: updateNodeSchema,
 *     rateLimit: 'write',
 *     permission: { action: 'update', resource: 'node' },
 *     scope: async ({ session, params }) =>
 *       isAdminRole(session.user.role) ||
 *       (await ownsNode(prisma, session.user.id, params.id)),
 *     handler: async ({ input, session, params }) => ({ ok: true }),
 *   });
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can, type Action, type Resource } from "@/lib/permissions";
import {
  rateLimit,
  rateLimitAuth,
  rateLimitAdmin,
  type RateLimitResult,
} from "@/lib/rate-limit";
import {
  apiOk,
  apiCreated,
  apiError,
  apiUnauthorized,
  apiForbidden,
  zodToApiError,
} from "@/lib/core/api-response";
import { sanitizeError } from "@/lib/core/safe-error";
import { getRequestId } from "@/lib/core/request-id";

// ─── Public types ───────────────────────────────────────────────

/** Profile name. The actual limits live in `lib/rate-limit.ts`. */
export type RateLimitProfile = "public" | "auth" | "write" | "expensive" | "internal";

export interface AuthedSession extends Session {
  user: NonNullable<Session["user"]> & { id: string; role: string };
}

/** Context handed to the handler. `session` is undefined for `route.public`. */
export interface RouteCtx<I, P extends Record<string, string> = Record<string, string>> {
  input: I;
  params: P;
  session: AuthedSession | undefined;
  request: Request;
  requestId: string;
}

const routeResultBrand: unique symbol = Symbol("routeResult");

export interface RouteResult<T> {
  readonly [routeResultBrand]: true;
  readonly data: T;
  readonly status: number;
}

export function routeResult<T>(data: T, status = 200): RouteResult<T> {
  return { [routeResultBrand]: true, data, status };
}

type RouteHandlerResult<O> = O | RouteResult<O>;

/** Context handed to permission scope functions. */
export interface ScopeCtx<I, P extends Record<string, string>> extends RouteCtx<I, P> {
  session: AuthedSession;
}

export type ScopeFn<I, P extends Record<string, string>> = (
  ctx: ScopeCtx<I, P>,
) => boolean | Promise<boolean>;

/** Fields shared by every variant. The handler signature varies per variant. */
interface BaseCfg<I, O> {
  /** Required Zod schema for the request body (POST/PATCH/PUT) or search params (GET/DELETE). */
  input: z.ZodSchema<I>;
  /** Optional Zod schema applied to handler return value. Recommended for /api/v1/*. */
  output?: z.ZodSchema<O>;
  /** Required rate-limit profile. */
  rateLimit: RateLimitProfile;
  /** HTTP status for success (default: 200). Use 201 for create. */
  successStatus?: number;
  /** Tag written to AuditLog on success. Reserved for follow-up PR. */
  audit?: string;
}

interface PublicCfg<I, O, P extends Record<string, string>> extends BaseCfg<I, O> {
  handler: (ctx: RouteCtx<I, P>) => Promise<RouteHandlerResult<O>>;
}

interface SessionCfg<I, O, P extends Record<string, string>> extends BaseCfg<I, O> {
  handler: (ctx: RouteCtx<I, P> & { session: AuthedSession }) => Promise<RouteHandlerResult<O>>;
}

interface PermissionCfg<I, O, P extends Record<string, string>> extends BaseCfg<I, O> {
  permission: { action: Action; resource: Resource };
  /** Row-level scope check. Return true if the session may act on this row. */
  scope?: ScopeFn<I, P>;
  handler: (ctx: RouteCtx<I, P> & { session: AuthedSession }) => Promise<RouteHandlerResult<O>>;
}

interface ServiceCfg<I, O, P extends Record<string, string>> extends BaseCfg<I, O> {
  /** Required header. Default: `x-service-token`. */
  tokenHeader?: string;
  /** Env var holding the expected token. Default: `SERVICE_TOKEN`. */
  tokenEnv?: string;
  handler: (ctx: RouteCtx<I, P>) => Promise<RouteHandlerResult<O>>;
}

/** A Next.js App Router route handler signature. */
type Handler = (req: Request, ctx: { params: Record<string, string> | Promise<Record<string, string>> }) => Promise<NextResponse>;

// ─── Internals ──────────────────────────────────────────────────

const BLOCKED_ACCOUNT_STATUSES = new Set(["LOCKED", "OFFBOARDED", "SUSPENDED"]);

function isBlocked(session: Session): boolean {
  const status = (session.user as Record<string, unknown> | undefined)?.accountStatus as string | undefined;
  return status ? BLOCKED_ACCOUNT_STATUSES.has(status) : false;
}

async function resolveParams(p: Record<string, string> | Promise<Record<string, string>>): Promise<Record<string, string>> {
  return p instanceof Promise ? await p : p;
}

/** Pull a stable per-caller key from the request. Prefers session.user.id, falls back to IP. */
function rateLimitKey(req: Request, session: Session | null): string {
  const userId = session?.user?.email ?? (session?.user as { id?: string } | undefined)?.id;
  if (userId) return `user:${userId}`;
  // Vercel/Cloudflare use these headers
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "unknown";
  return `ip:${ip}`;
}

async function applyRateLimit(profile: RateLimitProfile, key: string): Promise<RateLimitResult> {
  switch (profile) {
    case "internal":
      return { success: true, limit: 0, remaining: 0, reset: 0 };
    case "auth":
      return rateLimitAuth(`auth:${key}`);
    case "expensive":
      return rateLimitAdmin(`expensive:${key}`);
    case "write":
    case "public":
    default:
      return rateLimit(`${profile}:${key}`);
  }
}

function rateLimitedResponse(result: RateLimitResult, requestId: string): NextResponse {
  return apiError(
    "RATE_LIMITED",
    "Too many requests. Please try again later.",
    429,
    {
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset,
      requestId,
    },
  );
}

/** Read input from body for POST/PATCH/PUT, from search params for GET/DELETE. */
async function readInput<I>(req: Request, schema: z.ZodSchema<I>): Promise<{ ok: true; data: I } | { ok: false; res: NextResponse }> {
  const method = req.method.toUpperCase();
  let raw: unknown;
  if (method === "GET" || method === "DELETE" || method === "HEAD") {
    const url = new URL(req.url);
    raw = Object.fromEntries(url.searchParams.entries());
  } else {
    raw = await req.json().catch(() => ({}));
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, res: zodToApiError(parsed.error) };
  return { ok: true, data: parsed.data };
}

function shapeResponse<O>(data: O, status: number, output?: z.ZodSchema<O>): NextResponse {
  if (output) {
    const parsed = output.safeParse(data);
    if (!parsed.success) {
      // Output contract violated. Log and fall back to safe error so we don't leak the bad data.
      console.error("[route] output schema violation", parsed.error.issues);
      return apiError("INTERNAL_ERROR", "Response shape violated contract.", 500);
    }
    return status === 201 ? apiCreated(parsed.data) : apiOk(parsed.data, status);
  }
  return status === 201 ? apiCreated(data) : apiOk(data, status);
}

function isRouteResult<O>(value: RouteHandlerResult<O>): value is RouteResult<O> {
  return typeof value === "object" && value !== null && routeResultBrand in value;
}

function resolveHandlerResult<O>(value: RouteHandlerResult<O>, defaultStatus: number): { data: O; status: number } {
  if (isRouteResult(value)) return { data: value.data, status: value.status };
  return { data: value, status: defaultStatus };
}

function handleHandlerError(err: unknown, requestId: string): NextResponse {
  // Recognize a few common error contracts thrown by domain code.
  if (err && typeof err === "object" && "status" in err && "code" in err) {
    const e = err as { status: number; code: string; message?: string; details?: unknown };
    return apiError(e.code, e.message ?? sanitizeError(err), e.status, e.details);
  }
  if (err instanceof z.ZodError) return zodToApiError(err);
  console.error("[route] handler error", { requestId, err });
  return apiError("INTERNAL_ERROR", sanitizeError(err), 500);
}

// ─── Public builder ─────────────────────────────────────────────

export const route = {
  /** No auth required (marketing pages, /api/health, robots/og endpoints). */
  public<I, O, P extends Record<string, string> = Record<string, string>>(
    cfg: PublicCfg<I, O, P>,
  ): Handler {
    return async (req, nextCtx) => {
      const requestId = await getRequestId();
      const params = (await resolveParams(nextCtx.params)) as P;

      const rl = await applyRateLimit(cfg.rateLimit, rateLimitKey(req, null));
      if (!rl.success) return rateLimitedResponse(rl, requestId);

      const inputResult = await readInput(req, cfg.input);
      if (!inputResult.ok) return inputResult.res;

      try {
        const out = await cfg.handler({ input: inputResult.data, params, session: undefined, request: req, requestId });
        const result = resolveHandlerResult(out, cfg.successStatus ?? 200);
        return shapeResponse(result.data, result.status, cfg.output);
      } catch (err) {
        return handleHandlerError(err, requestId);
      }
    };
  },

  /** Any signed-in user with non-blocked account. No specific permission. */
  session<I, O, P extends Record<string, string> = Record<string, string>>(
    cfg: SessionCfg<I, O, P>,
  ): Handler {
    return async (req, nextCtx) => {
      const requestId = await getRequestId();
      const params = (await resolveParams(nextCtx.params)) as P;
      const session = await getServerSession(authOptions);
      if (!session?.user || isBlocked(session)) return apiUnauthorized();

      const rl = await applyRateLimit(cfg.rateLimit, rateLimitKey(req, session));
      if (!rl.success) return rateLimitedResponse(rl, requestId);

      const inputResult = await readInput(req, cfg.input);
      if (!inputResult.ok) return inputResult.res;

      try {
        const out = await cfg.handler({
          input: inputResult.data,
          params,
          session: session as AuthedSession,
          request: req,
          requestId,
        });
        const result = resolveHandlerResult(out, cfg.successStatus ?? 200);
        return shapeResponse(result.data, result.status, cfg.output);
      } catch (err) {
        return handleHandlerError(err, requestId);
      }
    };
  },

  /** Permission + optional row-level scope check. */
  permission<I, O, P extends Record<string, string> = Record<string, string>>(
    cfg: PermissionCfg<I, O, P>,
  ): Handler {
    return async (req, nextCtx) => {
      const requestId = await getRequestId();
      const params = (await resolveParams(nextCtx.params)) as P;
      const session = await getServerSession(authOptions);
      if (!session?.user || isBlocked(session)) return apiUnauthorized();

      const role = (session.user as { role?: string }).role ?? "USER";
      if (!can(role as Parameters<typeof can>[0], cfg.permission.action, cfg.permission.resource)) {
        return apiForbidden();
      }

      const rl = await applyRateLimit(cfg.rateLimit, rateLimitKey(req, session));
      if (!rl.success) return rateLimitedResponse(rl, requestId);

      const inputResult = await readInput(req, cfg.input);
      if (!inputResult.ok) return inputResult.res;

      const ctx: RouteCtx<I, P> & { session: AuthedSession } = {
        input: inputResult.data,
        params,
        session: session as AuthedSession,
        request: req,
        requestId,
      };

      if (cfg.scope) {
        const allowed = await cfg.scope(ctx);
        if (!allowed) return apiForbidden();
      }

      try {
        const out = await cfg.handler(ctx);
        const result = resolveHandlerResult(out, cfg.successStatus ?? 200);
        return shapeResponse(result.data, result.status, cfg.output);
      } catch (err) {
        return handleHandlerError(err, requestId);
      }
    };
  },

  /** Service-to-service caller (cron, internal job). Requires shared token header. */
  service<I, O, P extends Record<string, string> = Record<string, string>>(
    cfg: ServiceCfg<I, O, P>,
  ): Handler {
    const headerName = cfg.tokenHeader ?? "x-service-token";
    const envName = cfg.tokenEnv ?? "SERVICE_TOKEN";
    return async (req, nextCtx) => {
      const requestId = await getRequestId();
      const params = (await resolveParams(nextCtx.params)) as P;
      const expected = process.env[envName];
      const presented = req.headers.get(headerName);
      if (!expected || !presented || expected !== presented) return apiUnauthorized();

      const inputResult = await readInput(req, cfg.input);
      if (!inputResult.ok) return inputResult.res;

      try {
        const out = await cfg.handler({ input: inputResult.data, params, session: undefined, request: req, requestId });
        const result = resolveHandlerResult(out, cfg.successStatus ?? 200);
        return shapeResponse(result.data, result.status, cfg.output);
      } catch (err) {
        return handleHandlerError(err, requestId);
      }
    };
  },
};

/**
 * Typed error throwable from inside a handler. The builder catches it and
 * maps to a uniform API error response.
 */
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
