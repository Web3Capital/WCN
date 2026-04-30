import { describe, it, expect, beforeEach } from "vitest";
import { issueNonce, consumeNonce, __resetMemoryStoreForTests } from "../nonce";

// These tests run against the in-memory fallback (Redis env unset in test env).

beforeEach(() => {
  __resetMemoryStoreForTests();
});

describe("siwe nonce store (memory fallback)", () => {
  it("a freshly issued nonce can be consumed exactly once", async () => {
    const n = await issueNonce();
    expect(typeof n).toBe("string");
    expect(n.length).toBeGreaterThan(8);

    expect(await consumeNonce(n)).toBe(true);
    // Second consume must fail — this is the replay protection invariant.
    expect(await consumeNonce(n)).toBe(false);
  });

  it("rejects an unknown nonce", async () => {
    expect(await consumeNonce("never-issued")).toBe(false);
  });

  it("rejects empty / non-string input", async () => {
    expect(await consumeNonce("")).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(await consumeNonce(null)).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(await consumeNonce(undefined)).toBe(false);
  });

  it("issues unique nonces across calls", async () => {
    const a = await issueNonce();
    const b = await issueNonce();
    const c = await issueNonce();
    expect(new Set([a, b, c]).size).toBe(3);
  });
});
