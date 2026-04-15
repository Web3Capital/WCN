import { expect, test } from "@playwright/test";

test.describe("public API smoke", () => {
  test("GET /api/health responds with status payload", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toMatchObject({
      status: expect.stringMatching(/healthy|degraded/),
    });
  });

  test("GET /api/nodes without session is unauthorized", async ({ request }) => {
    const res = await request.get("/api/nodes");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false });
    expect(body.error?.code).toBe("UNAUTHORIZED");
  });
});
