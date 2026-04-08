import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

type RouteCtx = {
  params?: Promise<{ nextauth?: string[] }> | { nextauth?: string[] };
};

/** NextAuth picks App vs Pages handler via `context.params`; some runtimes omit it — derive from the URL. */
async function withRouteParams(req: NextRequest, context: RouteCtx) {
  const raw = context?.params;
  const resolved =
    raw && typeof (raw as Promise<unknown>).then === "function"
      ? await (raw as Promise<{ nextauth?: string[] }>)
      : (raw as { nextauth?: string[] } | undefined);
  if (resolved?.nextauth?.length) {
    return { params: Promise.resolve(resolved) };
  }
  const pathname = req.nextUrl.pathname;
  const base = "/api/auth";
  const segs =
    pathname.startsWith(`${base}/`)
      ? pathname.slice(base.length + 1).split("/").filter(Boolean)
      : [];
  return { params: Promise.resolve({ nextauth: segs }) };
}

export async function GET(req: NextRequest, context: RouteCtx) {
  return handler(req, await withRouteParams(req, context));
}

export async function POST(req: NextRequest, context: RouteCtx) {
  return handler(req, await withRouteParams(req, context));
}
