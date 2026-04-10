import { NextResponse, type NextRequest } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { validateApiKey, hasScope } from "./service";

export type ApiKeyAuth = {
  authenticated: true;
  keyId: string;
  userId?: string;
  nodeId?: string;
  scopes: string[];
};

export async function authenticateApiKey(
  req: NextRequest,
): Promise<ApiKeyAuth | NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer wcn_")) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid API key. Use: Authorization: Bearer wcn_..." } },
      { status: 401 },
    );
  }

  const raw = authHeader.slice(7);
  const prisma = getPrisma();
  const result = await validateApiKey(prisma, raw);

  if (!result.valid) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid, expired, or revoked API key." } },
      { status: 401 },
    );
  }

  return {
    authenticated: true,
    keyId: result.keyId!,
    userId: result.userId,
    nodeId: result.nodeId,
    scopes: result.scopes ?? ["read"],
  };
}

export function requireScope(auth: ApiKeyAuth, scope: string): NextResponse | null {
  if (!hasScope(auth.scopes, scope)) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: `Missing required scope: ${scope}` } },
      { status: 403 },
    );
  }
  return null;
}
