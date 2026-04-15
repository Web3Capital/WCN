import { describe, expect, it } from "vitest";
import { redactNodeForMember } from "../member-redact";

describe("redactNodeForMember", () => {
  it("clears ownerUserId and owner email", () => {
    const node = {
      id: "n1",
      name: "Test",
      ownerUserId: "u1",
      owner: { id: "u1", name: "Alice", email: "alice@example.com" },
    };
    const out = redactNodeForMember(node);
    expect(out.ownerUserId).toBeNull();
    expect((out as any).owner?.email).toBeNull();
    expect((out as any).owner?.id).toBe("u1");
    expect((out as any).owner?.name).toBe("Alice");
  });
});
