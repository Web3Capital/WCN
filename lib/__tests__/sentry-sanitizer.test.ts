import { describe, it, expect } from "vitest";
import { sanitizeSentryEvent } from "../sentry-sanitizer";
import type { ErrorEvent } from "@sentry/nextjs";

function event(overrides: Partial<ErrorEvent>): ErrorEvent {
  return { type: undefined, ...overrides } as ErrorEvent;
}

describe("sanitizeSentryEvent", () => {
  it("redacts Authorization and Cookie headers", () => {
    const result = sanitizeSentryEvent(
      event({
        request: {
          url: "https://example.com/api/x",
          headers: {
            Authorization: "Bearer SECRET",
            Cookie: "next-auth.session-token=abc",
            "X-Request-Id": "req_123",
          },
        },
      }),
    );
    expect(result?.request?.headers?.Authorization).toBe("[Filtered]");
    expect(result?.request?.headers?.Cookie).toBe("[Filtered]");
    expect(result?.request?.headers?.["X-Request-Id"]).toBe("req_123");
  });

  it("redacts sensitive query params in url", () => {
    const result = sanitizeSentryEvent(
      event({
        request: {
          url: "https://example.com/api/admin/account-status?email=a@b.com&secret=ABC123",
        },
      }),
    );
    expect(result?.request?.url).not.toContain("ABC123");
    // URL-encoded form of [Filtered]
    expect(result?.request?.url).toMatch(/secret=(?:%5BFiltered%5D|\[Filtered\])/);
    expect(result?.request?.url).toContain("a%40b.com");
  });

  it("redacts password / token / signature in request body", () => {
    const result = sanitizeSentryEvent(
      event({
        request: {
          url: "https://example.com/api/x",
          data: {
            email: "a@b.com",
            password: "hunter2",
            signature: "0xdead",
            nested: { newPassword: "x", currentPassword: "y", okay: "value" },
          },
        },
      }),
    );
    const data = result?.request?.data as Record<string, unknown>;
    expect(data.email).toBe("a@b.com");
    expect(data.password).toBe("[Filtered]");
    expect(data.signature).toBe("[Filtered]");
    const nested = data.nested as Record<string, unknown>;
    expect(nested.newPassword).toBe("[Filtered]");
    expect(nested.currentPassword).toBe("[Filtered]");
    expect(nested.okay).toBe("value");
  });

  it("strips email and ip_address from user, keeps id", () => {
    const result = sanitizeSentryEvent(
      event({
        user: { id: "user_123", email: "a@b.com", ip_address: "1.2.3.4", username: "alice" },
      }),
    );
    expect(result?.user).toEqual({ id: "user_123" });
  });

  it("redacts breadcrumb data", () => {
    const result = sanitizeSentryEvent(
      event({
        breadcrumbs: [
          {
            category: "fetch",
            data: { url: "https://x?token=abc", body: { password: "p" } },
          },
        ],
      }),
    );
    const bc = result?.breadcrumbs?.[0]?.data as Record<string, unknown>;
    const body = bc?.body as Record<string, unknown>;
    expect(body.password).toBe("[Filtered]");
  });

  it("never exceeds depth 6 on cycles", () => {
    type Cyclic = { a?: Cyclic };
    const cyclic: Cyclic = {};
    cyclic.a = cyclic;
    expect(() => sanitizeSentryEvent(event({ extra: { c: cyclic } }))).not.toThrow();
  });
});
