import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, hasScope } from "../service";

describe("API Key Service", () => {
  describe("generateApiKey", () => {
    it("generates a key starting with wcn_", () => {
      const { raw } = generateApiKey();
      expect(raw.startsWith("wcn_")).toBe(true);
    });

    it("generates a 68-char key (4 prefix + 64 hex)", () => {
      const { raw } = generateApiKey();
      expect(raw.length).toBe(68);
    });

    it("generates different keys each call", () => {
      const a = generateApiKey();
      const b = generateApiKey();
      expect(a.raw).not.toBe(b.raw);
      expect(a.hash).not.toBe(b.hash);
    });

    it("returns a valid SHA-256 hash", () => {
      const { hash } = generateApiKey();
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("returns a prefix matching the start of the raw key", () => {
      const { raw, prefix } = generateApiKey();
      expect(raw.startsWith(prefix)).toBe(true);
    });
  });

  describe("hashApiKey", () => {
    it("produces deterministic output", () => {
      const raw = "wcn_testkey123";
      expect(hashApiKey(raw)).toBe(hashApiKey(raw));
    });

    it("different keys produce different hashes", () => {
      expect(hashApiKey("key1")).not.toBe(hashApiKey("key2"));
    });
  });

  describe("hasScope", () => {
    it("matches exact scope", () => {
      expect(hasScope(["read", "write"], "read")).toBe(true);
      expect(hasScope(["read", "write"], "write")).toBe(true);
    });

    it("returns false for missing scope", () => {
      expect(hasScope(["read"], "write")).toBe(false);
    });

    it("wildcard * matches everything", () => {
      expect(hasScope(["*"], "read")).toBe(true);
      expect(hasScope(["*"], "write:projects")).toBe(true);
      expect(hasScope(["*"], "anything")).toBe(true);
    });

    it("action wildcard matches sub-scopes", () => {
      expect(hasScope(["read:*"], "read:projects")).toBe(true);
    });

    it("handles empty scopes", () => {
      expect(hasScope([], "read")).toBe(false);
    });
  });
});
