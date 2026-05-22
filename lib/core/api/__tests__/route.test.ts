import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { route, HttpError } from "@/lib/core/api/route";

// ─── Mocks ──────────────────────────────────────────────────────

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockCan = vi.fn();
vi.mock("@/lib/permissions", () => ({
  can: (...args: unknown[]) => mockCan(...args),
}));

const mockRateLimit = vi.fn();
const mockRateLimitAuth = vi.fn();
const mockRateLimitAdmin = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (k: string) => mockRateLimit(k),
  rateLimitAuth: (k: string) => mockRateLimitAuth(k),
  rateLimitAdmin: (k: string) => mockRateLimitAdmin(k),
}));

vi.mock("@/lib/core/request-id", () => ({
  getRequestId: () => "req_test_abc",
}));

// ─── Helpers ────────────────────────────────────────────────────

function makeReq(method: string, body?: unknown, search?: string): Request {
  const url = `http://localhost/api/test${search ? "?" + search : ""}`;
  const init: RequestInit = { method };
  if (body !== undefined && method !== "GET") {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new Request(url, init);
}

async function readJson(res: Response) {
  return res.json();
}

const okLimit = { success: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 };
const blockedLimit = { success: false, limit: 60, remaining: 0, reset: Date.now() + 60_000 };

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockCan.mockReset();
  mockRateLimit.mockReset().mockResolvedValue(okLimit);
  mockRateLimitAuth.mockReset().mockResolvedValue(okLimit);
  mockRateLimitAdmin.mockReset().mockResolvedValue(okLimit);
});

// ─── Tests ──────────────────────────────────────────────────────

describe("route.public", () => {
  it("invokes handler and shapes response", async () => {
    const handler = route.public({
      input: z.object({}),
      rateLimit: "public",
      handler: async () => ({ version: "1.0" }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body).toEqual({ ok: true, data: { version: "1.0" } });
  });

  it("returns 400 on invalid input", async () => {
    const handler = route.public({
      input: z.object({ x: z.string() }),
      rateLimit: "public",
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(400);
    const body = await readJson(res);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("reads input from search params on GET", async () => {
    const handler = route.public({
      input: z.object({ q: z.string() }),
      rateLimit: "public",
      handler: async ({ input }) => ({ echo: input.q }),
    });
    const res = await handler(makeReq("GET", undefined, "q=hello"), { params: {} });
    const body = await readJson(res);
    expect(body.data).toEqual({ echo: "hello" });
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockRateLimit.mockResolvedValueOnce(blockedLimit);
    const handler = route.public({
      input: z.object({}),
      rateLimit: "public",
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(429);
    const body = await readJson(res);
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("uses successStatus when provided", async () => {
    const handler = route.public({
      input: z.object({}),
      rateLimit: "public",
      successStatus: 201,
      handler: async () => ({ id: "x" }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(201);
  });
});

describe("route.session", () => {
  it("returns 401 when not signed in", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const handler = route.session({
      input: z.object({}),
      rateLimit: "write",
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(401);
  });

  it("returns 401 when account is blocked", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "u1", email: "u@x.com", role: "USER", accountStatus: "LOCKED" },
    });
    const handler = route.session({
      input: z.object({}),
      rateLimit: "write",
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(401);
  });

  it("invokes handler when signed in with active account", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "u1", email: "u@x.com", role: "USER", accountStatus: "ACTIVE" },
    });
    const handler = route.session({
      input: z.object({ note: z.string() }),
      rateLimit: "write",
      handler: async ({ session, input }) => ({ userId: session.user.email, note: input.note }),
    });
    const res = await handler(makeReq("POST", { note: "hi" }), { params: {} });
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.data).toEqual({ userId: "u@x.com", note: "hi" });
  });
});

describe("route.permission", () => {
  const aliceAdmin = { user: { id: "alice", email: "a@x.com", role: "ADMIN", accountStatus: "ACTIVE" } };
  const bobUser = { user: { id: "bob", email: "b@x.com", role: "USER", accountStatus: "ACTIVE" } };

  it("returns 401 when not signed in", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const handler = route.permission({
      input: z.object({}),
      rateLimit: "write",
      permission: { action: "update", resource: "node" },
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(401);
  });

  it("returns 403 when permission denied", async () => {
    mockGetServerSession.mockResolvedValueOnce(bobUser);
    mockCan.mockReturnValueOnce(false);
    const handler = route.permission({
      input: z.object({}),
      rateLimit: "write",
      permission: { action: "delete", resource: "settlement" },
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(403);
  });

  it("invokes handler when permission granted and no scope", async () => {
    mockGetServerSession.mockResolvedValueOnce(aliceAdmin);
    mockCan.mockReturnValueOnce(true);
    const handler = route.permission({
      input: z.object({}),
      rateLimit: "write",
      permission: { action: "update", resource: "node" },
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(200);
  });

  it("returns 403 when scope rejects", async () => {
    mockGetServerSession.mockResolvedValueOnce(bobUser);
    mockCan.mockReturnValueOnce(true);
    const handler = route.permission({
      input: z.object({}),
      rateLimit: "write",
      permission: { action: "update", resource: "node" },
      scope: async () => false,
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(403);
  });

  it("invokes handler when scope accepts", async () => {
    mockGetServerSession.mockResolvedValueOnce(bobUser);
    mockCan.mockReturnValueOnce(true);
    const handler = route.permission({
      input: z.object({}),
      rateLimit: "write",
      permission: { action: "update", resource: "node" },
      scope: async () => true,
      handler: async ({ session }) => ({ user: session.user.email }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(200);
  });
});

describe("route.service", () => {
  it("returns 401 when token missing", async () => {
    process.env.SERVICE_TOKEN = "secret-xyz";
    const handler = route.service({
      input: z.object({}),
      rateLimit: "internal",
      handler: async () => ({ ok: true }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(401);
  });

  it("invokes handler when correct token presented", async () => {
    process.env.SERVICE_TOKEN = "secret-xyz";
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-service-token": "secret-xyz" },
      body: "{}",
    });
    const handler = route.service({
      input: z.object({}),
      rateLimit: "internal",
      handler: async () => ({ ran: true }),
    });
    const res = await handler(req, { params: {} });
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.data).toEqual({ ran: true });
  });
});

describe("error mapping", () => {
  it("maps HttpError to declared status + code", async () => {
    const handler = route.public({
      input: z.object({}),
      rateLimit: "public",
      handler: async () => {
        throw new HttpError(422, "AMOUNT_TOO_LARGE", "Amount exceeds limit", { max: 1000 });
      },
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(422);
    const body = await readJson(res);
    expect(body.error.code).toBe("AMOUNT_TOO_LARGE");
    expect(body.error.details).toEqual({ max: 1000 });
  });

  it("maps unexpected errors to 500", async () => {
    // suppress noisy console.error
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = route.public({
      input: z.object({}),
      rateLimit: "public",
      handler: async () => {
        throw new Error("boom");
      },
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });
});

describe("output schema", () => {
  it("validates handler output and returns 500 on contract violation", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Cast through `unknown` to bypass the compile-time output-shape check —
    // we are intentionally simulating a runtime mismatch (e.g. handler
    // returns drift, DB shape change) to verify the runtime guard works.
    const handler = route.public({
      input: z.object({}),
      output: z.object({ id: z.string() }) as unknown as z.ZodSchema<{ id: string }>,
      rateLimit: "public",
      handler: async () => ({ id: 12345 } as unknown as { id: string }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });

  it("passes valid output through", async () => {
    const handler = route.public({
      input: z.object({}),
      output: z.object({ id: z.string() }),
      rateLimit: "public",
      handler: async () => ({ id: "abc" }),
    });
    const res = await handler(makeReq("POST", {}), { params: {} });
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.data).toEqual({ id: "abc" });
  });
});
