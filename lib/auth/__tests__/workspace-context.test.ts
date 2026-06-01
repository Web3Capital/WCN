import { describe, expect, it } from "vitest";
import type { Role, AccountStatus } from "@prisma/client";
import type { Session } from "next-auth";
import { getWorkspaceContext, requireWorkspaceContext } from "../workspace-context";

function mkSession(overrides: Partial<{
  id: string;
  role: Role;
  activeRole: Role | null;
  activeWorkspaceId: string | null;
}> = {}): Session {
  return {
    user: {
      id: overrides.id ?? "u_alice",
      role: overrides.role ?? "NODE_OWNER",
      accountStatus: "ACTIVE" as AccountStatus,
      nodeIds: [],
      activeWorkspaceId: overrides.activeWorkspaceId ?? null,
      activeRole: overrides.activeRole ?? overrides.role ?? "NODE_OWNER",
    },
    expires: "",
  };
}

describe("getWorkspaceContext", () => {
  it("returns null when session is null", () => {
    expect(getWorkspaceContext(null)).toBeNull();
  });

  it("returns null when session.user.id is missing", () => {
    expect(getWorkspaceContext({ user: {} } as unknown as Session)).toBeNull();
  });

  it("derives non-admin context", () => {
    const ctx = getWorkspaceContext(mkSession({ role: "NODE_OWNER" }));
    expect(ctx).toEqual({
      userId: "u_alice",
      role: "NODE_OWNER",
      activeRole: "NODE_OWNER",
      activeWorkspaceId: null,
      isAdmin: false,
    });
  });

  it("flags FOUNDER and ADMIN as admin", () => {
    expect(getWorkspaceContext(mkSession({ role: "FOUNDER" }))?.isAdmin).toBe(true);
    expect(getWorkspaceContext(mkSession({ role: "ADMIN" }))?.isAdmin).toBe(true);
    expect(getWorkspaceContext(mkSession({ role: "FINANCE_ADMIN" }))?.isAdmin).toBe(false);
  });

  it("threads activeWorkspaceId through", () => {
    const ctx = getWorkspaceContext(mkSession({ activeWorkspaceId: "ws_42" }));
    expect(ctx?.activeWorkspaceId).toBe("ws_42");
  });

  it("falls back to role when activeRole is missing", () => {
    const session = mkSession({ role: "NODE_OWNER" });
    delete (session.user as { activeRole?: Role }).activeRole;
    const ctx = getWorkspaceContext(session);
    expect(ctx?.activeRole).toBe("NODE_OWNER");
  });
});

describe("requireWorkspaceContext", () => {
  it("throws UNAUTHENTICATED when session is null", () => {
    expect(() => requireWorkspaceContext(null)).toThrow("UNAUTHENTICATED");
  });

  it("throws WORKSPACE_REQUIRED when activeWorkspaceId is null", () => {
    expect(() =>
      requireWorkspaceContext(mkSession({ activeWorkspaceId: null })),
    ).toThrow("WORKSPACE_REQUIRED");
  });

  it("returns context with non-null activeWorkspaceId on success", () => {
    const ctx = requireWorkspaceContext(mkSession({ activeWorkspaceId: "ws_99" }));
    expect(ctx.activeWorkspaceId).toBe("ws_99");
  });

  it("attaches a code to thrown error", () => {
    try {
      requireWorkspaceContext(null);
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as { code?: string }).code).toBe("UNAUTHORIZED");
    }
    try {
      requireWorkspaceContext(mkSession({ activeWorkspaceId: null }));
      expect.fail("should have thrown");
    } catch (e) {
      expect((e as { code?: string }).code).toBe("WORKSPACE_REQUIRED");
    }
  });
});
