import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "../rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rateLimit", () => {
  it("can be explicitly disabled for isolated e2e environments", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_DISABLED", "1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);

    await expect(rateLimit("ci-e2e-user")).resolves.toMatchObject({ success: true });
  });
});
