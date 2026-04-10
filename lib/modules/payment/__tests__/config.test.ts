import { describe, it, expect } from "vitest";
import { CHAIN_CONFIGS, getChainConfig } from "../config";

describe("Payment Chain Config", () => {
  describe("CHAIN_CONFIGS", () => {
    it("has polygon, base, and ethereum chains", () => {
      expect(CHAIN_CONFIGS.polygon).toBeDefined();
      expect(CHAIN_CONFIGS.base).toBeDefined();
      expect(CHAIN_CONFIGS.ethereum).toBeDefined();
    });

    it("polygon has chainId 137", () => {
      expect(CHAIN_CONFIGS.polygon.chainId).toBe(137);
    });

    it("all chains have USDC addresses starting with 0x", () => {
      for (const chain of Object.values(CHAIN_CONFIGS)) {
        expect(chain.usdcAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    it("all chains have 6 decimals for USDC", () => {
      for (const chain of Object.values(CHAIN_CONFIGS)) {
        expect(chain.decimals).toBe(6);
      }
    });
  });

  describe("getChainConfig", () => {
    it("defaults to polygon when no chain specified", () => {
      const config = getChainConfig();
      expect(config.chainId).toBe(137);
      expect(config.name).toBe("Polygon PoS");
    });

    it("returns polygon explicitly", () => {
      expect(getChainConfig("polygon").chainId).toBe(137);
    });

    it("returns base config", () => {
      expect(getChainConfig("base").chainId).toBe(8453);
    });

    it("returns ethereum config", () => {
      expect(getChainConfig("ethereum").chainId).toBe(1);
    });

    it("falls back to polygon for unknown chain", () => {
      expect(getChainConfig("unknown").chainId).toBe(137);
    });
  });
});
