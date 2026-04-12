import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit, rateLimitAuth, rateLimitAdmin } from "./lib/rate-limit";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { locales } from "./i18n/config";

const intlMiddleware = createIntlMiddleware(routing);

const localePattern = new RegExp(`^\\/(${locales.join("|")})(\/|$)`);

const PUBLIC_PAGE_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/apply",
  "/about",
  "/how-it-works",
  "/nodes",
  "/pob",
]);

function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(localePattern);
  if (match) {
    const rest = pathname.slice(match[1].length + 1);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname;
}

function isPublicPath(pathname: string): boolean {
  const bare = stripLocalePrefix(pathname);
  if (PUBLIC_PAGE_PATHS.has(bare)) return true;
  if (bare.startsWith("/login/")) return true;
  if (bare.startsWith("/wiki")) return true;
  if (bare.startsWith("/api/auth")) return true;
  if (bare.startsWith("/api/signup")) return true;
  if (bare.startsWith("/api/applications") && bare === "/api/applications") return true;
  if (bare.startsWith("/api/theme")) return true;
  if (bare.startsWith("/api/lang")) return true;
  if (bare.startsWith("/api/invites/")) return true;
  if (bare.startsWith("/invite/")) return true;
  if (bare.startsWith("/_next")) return true;
  if (bare.startsWith("/favicon")) return true;
  if (bare.startsWith("/api/v1/")) return true;
  if (bare === "/api/health") return true;
  if (bare === "/api/cron") return true;
  if (bare === "/api/admin/account-status") return true;
  return false;
}

const BLOCKED_STATUSES = new Set(["LOCKED", "OFFBOARDED", "SUSPENDED"]);
const AUTH_PATHS = ["/api/signup", "/api/auth"];
const ADMIN_PATHS = ["/api/settlement", "/api/approvals", "/api/entity-freeze"];

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

function rateLimitResponse(result: { limit: number; remaining: number; reset: number }) {
  return NextResponse.json(
    { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
        "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
      },
    },
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestId = request.headers.get("x-request-id") || `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  function withRequestId(response: NextResponse): NextResponse {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Skip i18n for API routes, static files, and internal Next.js paths
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next")) {
    if (isPublicPath(pathname)) {
      return withRequestId(NextResponse.next());
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (pathname.startsWith("/api/") && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
      const ip = getClientIp(request);
      const rl = await rateLimitAuth(ip);
      if (!rl.success) return withRequestId(rateLimitResponse(rl));
    }

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return withRequestId(NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 }));
      }
      return withRequestId(NextResponse.next());
    }

    if (token.accountStatus && BLOCKED_STATUSES.has(token.accountStatus as string)) {
      if (pathname.startsWith("/api/")) {
        return withRequestId(NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Account is blocked." } }, { status: 403 }));
      }
    }

    if (pathname.startsWith("/api/")) {
      const userId = token.sub ?? getClientIp(request);
      if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
        const rl = await rateLimitAdmin(userId);
        if (!rl.success) return withRequestId(rateLimitResponse(rl));
      } else {
        const rl = await rateLimit(userId);
        if (!rl.success) return withRequestId(rateLimitResponse(rl));
      }
    }

    return withRequestId(NextResponse.next());
  }

  // For page routes: run next-intl middleware first for locale detection/redirect
  const intlResponse = intlMiddleware(request);
  intlResponse.headers.set("x-request-id", requestId);
  intlResponse.headers.set("x-url", request.url);

  // If next-intl issued a redirect (e.g. bare /about -> /en/about), return it
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const bare = stripLocalePrefix(pathname);

  if (isPublicPath(pathname)) {
    return intlResponse;
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const locale = pathname.match(localePattern)?.[1] || "en";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withRequestId(NextResponse.redirect(loginUrl));
  }

  if (token.accountStatus && BLOCKED_STATUSES.has(token.accountStatus as string)) {
    const locale = pathname.match(localePattern)?.[1] || "en";
    if (!bare.startsWith("/account")) {
      return withRequestId(NextResponse.redirect(new URL(`/${locale}/login?error=blocked`, request.url)));
    }
  }

  if (token.accountStatus === "PENDING_2FA") {
    const locale = pathname.match(localePattern)?.[1] || "en";
    const allowed2faPaths = ["/account", "/account/2fa"];
    const isAllowed = allowed2faPaths.some((p) => bare === p || bare.startsWith(`${p}/`));
    if (!isAllowed) {
      return withRequestId(NextResponse.redirect(new URL(`/${locale}/account/2fa`, request.url)));
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
