import { describe, it, expect } from "vitest";
import { apiOk, apiCreated, apiError, apiNotFound, apiUnauthorized, apiForbidden, apiValidationError } from "@/lib/core/api-response";

async function parseResponse(response: Response) {
  return response.json();
}

describe("API Response Helpers", () => {
  it("apiOk returns ok:true with data", async () => {
    const res = apiOk({ id: "1", name: "test" });
    const body = await parseResponse(res);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({ id: "1", name: "test" });
    expect(res.status).toBe(200);
  });

  it("apiCreated returns 201", async () => {
    const res = apiCreated({ id: "new" });
    const body = await parseResponse(res);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({ id: "new" });
    expect(res.status).toBe(201);
  });

  it("apiNotFound returns 404", async () => {
    const res = apiNotFound("User");
    const body = await parseResponse(res);
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("User");
    expect(body.error.code).toBe("NOT_FOUND");
    expect(res.status).toBe(404);
  });

  it("apiUnauthorized returns 401", async () => {
    const res = apiUnauthorized();
    expect(res.status).toBe(401);
    const body = await parseResponse(res);
    expect(body.ok).toBe(false);
  });

  it("apiForbidden returns 403", async () => {
    const res = apiForbidden();
    expect(res.status).toBe(403);
  });

  it("apiValidationError returns 400 with field errors", async () => {
    const res = apiValidationError([
      { path: "email", message: "Required" },
      { path: "name", message: "Too short" },
    ]);
    const body = await parseResponse(res);
    expect(body.ok).toBe(false);
    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toHaveLength(2);
  });

  it("apiError returns custom status and code", async () => {
    const res = apiError("INTERNAL_ERROR", "Something broke", 500);
    const body = await parseResponse(res);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Something broke");
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(res.status).toBe(500);
  });
});
