import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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
  return false;
}

const BLOCKED_STATUSES = new Set(["LOCKED", "OFFBOARDED", "SUSPENDED"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.accountStatus && BLOCKED_STATUSES.has(token.accountStatus as string)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Account blocked" }, { status: 403 });
    }
    if (pathname !== "/account" && !pathname.startsWith("/account/")) {
      return NextResponse.redirect(new URL("/login?error=blocked", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
