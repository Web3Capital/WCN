import { NextResponse } from "next/server";
import { issueNonce } from "@/lib/modules/siwe/nonce";

// Each call must mint a fresh nonce → render must be per-request, never
// statically prerendered at build time. Without this, Next attempts to
// optimize the route as static during `next build`, hits issueNonce()'s
// production guard (UPSTASH_REDIS_REST_URL absent in build env), and fails.
export const dynamic = "force-dynamic";

export async function GET() {
  const nonce = await issueNonce();
  return NextResponse.json({ nonce });
}
