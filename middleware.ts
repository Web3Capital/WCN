import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit, rateLimitAuth, rateLimitAdmin } from "./lib/rate-limit";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/apply",
  "/about",
  "/how-it-works",
  "/nodes",
  "/pob",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/login/")) return true;
  if (pathname.startsWith("/wiki")) return true;
  if (pathname.startsWith("/docs")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/signup")) return true;
  if (pathname.startsWith("/api/applications") && pathname === "/api/applications") return true;
  if (pathname.startsWith("/api/theme")) return true;
  if (pathname.startsWith("/api/lang")) return true;
  if (pathname.startsWith("/invite/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  // Open API v1 routes use their own API key auth — skip session check here
  if (pathname.startsWith("/api/v1/")) return true;
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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Rate limit auth endpoints by IP (10/min)
  if (pathname.startsWith("/api/") && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const ip = getClientIp(request);
    const rl = await rateLimitAuth(ip);
    if (!rl.success) return rateLimitResponse(rl);
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.accountStatus && BLOCKED_STATUSES.has(token.accountStatus as string)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Account is blocked." } }, { status: 403 });
    }
    if (pathname !== "/account" && !pathname.startsWith("/account/")) {
      return NextResponse.redirect(new URL("/login?error=blocked", request.url));
    }
  }

  if (token.accountStatus === "PENDING_2FA") {
    const allowed2faPaths = ["/account", "/account/2fa", "/api/account/2fa", "/api/auth"];
    const isAllowed = allowed2faPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!isAllowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: { code: "2FA_SETUP_REQUIRED", message: "Complete 2FA setup to continue." } }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/account/2fa", request.url));
    }
  }

  // Rate limit API routes for authenticated users
  if (pathname.startsWith("/api/")) {
    const userId = token.sub ?? getClientIp(request);

    if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      const rl = await rateLimitAdmin(userId);
      if (!rl.success) return rateLimitResponse(rl);
    } else {
      const rl = await rateLimit(userId);
      if (!rl.success) return rateLimitResponse(rl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
