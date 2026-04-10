/**
 * Higher-order function that wraps API route handlers with authentication.
 * Makes it impossible to forget auth checks.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, ErrorCode } from "@/lib/core/api-response";

type AuthenticatedSession = {
  user: { id: string; role: string; email: string; accountStatus: string };
};

type AuthenticatedHandler = (
  req: NextRequest,
  session: AuthenticatedSession,
  params?: any,
) => Promise<NextResponse>;

type PermissionCheck = {
  action: string;
  resource: string;
};

interface WithAuthOptions {
  permission?: PermissionCheck;
  roles?: string[];
}

export function withAuth(handler: AuthenticatedHandler, options?: WithAuthOptions) {
  return async (req: NextRequest, context?: any) => {
    const session = await getServerSession(authOptions) as AuthenticatedSession | null;

    if (!session?.user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
    }

    const { user } = session;

    if (user.accountStatus === "LOCKED" || user.accountStatus === "SUSPENDED" || user.accountStatus === "OFFBOARDED") {
      return apiError(ErrorCode.FORBIDDEN, "Account is not active", 403);
    }

    if (options?.roles && !options.roles.includes(user.role)) {
      return apiError(ErrorCode.FORBIDDEN, "Insufficient role", 403);
    }

    if (options?.permission) {
      const { can } = await import("@/lib/permissions");
      if (!can(user.role as any, options.permission.action as any, options.permission.resource as any)) {
        return apiError(ErrorCode.FORBIDDEN, "Insufficient permissions", 403);
      }
    }

    return handler(req, session, context?.params);
  };
}
