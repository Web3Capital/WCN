import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldUsePrismaSsl } from "../prisma";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("shouldUsePrismaSsl", () => {
  it("does not enable SSL for local production databases", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DB_SSL", undefined);

    expect(shouldUsePrismaSsl("postgresql://wcn:wcn@localhost:5432/wcn_e2e")).toBe(false);
    expect(shouldUsePrismaSsl("postgresql://wcn:wcn@127.0.0.1:5432/wcn_e2e")).toBe(false);
  });

  it("enables SSL for production non-local databases by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DB_SSL", undefined);

    expect(shouldUsePrismaSsl("postgresql://wcn:wcn@db.example.com:5432/wcn")).toBe(true);
  });

  it("honors explicit URL and environment overrides", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DB_SSL", undefined);

    expect(shouldUsePrismaSsl("postgresql://wcn:wcn@localhost:5432/wcn?sslmode=require")).toBe(true);
    expect(shouldUsePrismaSsl("postgresql://wcn:wcn@db.example.com:5432/wcn?sslmode=disable")).toBe(false);

    vi.stubEnv("DB_SSL", "false");
    expect(shouldUsePrismaSsl("postgresql://wcn:wcn@db.example.com:5432/wcn?sslmode=require")).toBe(false);

    vi.stubEnv("DB_SSL", "true");
    expect(shouldUsePrismaSsl("postgresql://wcn:wcn@localhost:5432/wcn?sslmode=disable")).toBe(true);
  });
});
