import { describe, expect, it } from "vitest";
import {
  buildNodeListFilters,
  buildNodeListWhere,
  mergeNodeWhere,
  memberOwnedNodesWhere,
} from "@/app/api/nodes/list-where";

describe("mergeNodeWhere", () => {
  it("returns b when a is empty", () => {
    expect(mergeNodeWhere({}, { ownerUserId: "u1" })).toEqual({ ownerUserId: "u1" });
  });

  it("returns a when b is empty", () => {
    expect(mergeNodeWhere({ status: "LIVE" }, {})).toEqual({ status: "LIVE" });
  });

  it("combines with AND", () => {
    expect(
      mergeNodeWhere({ status: "LIVE" }, { ownerUserId: "u1" }),
    ).toEqual({
      AND: [{ status: "LIVE" }, { ownerUserId: "u1" }],
    });
  });
});

describe("memberOwnedNodesWhere", () => {
  it("scopes to owner", () => {
    expect(memberOwnedNodesWhere("abc")).toEqual({ ownerUserId: "abc" });
  });
});

describe("buildNodeListWhere + cursor", () => {
  const anchor = { id: "n2", createdAt: new Date("2024-01-02T00:00:00Z") };

  it("merges filters with cursor seek", () => {
    const w = buildNodeListWhere({
      status: "LIVE",
      type: null,
      region: null,
      cursorAnchor: anchor,
    });
    expect(w).toMatchObject({
      AND: expect.arrayContaining([
        { status: "LIVE" },
        {
          OR: expect.any(Array),
        },
      ]),
    });
  });
});

describe("buildNodeListFilters", () => {
  it("returns empty object when no filters", () => {
    expect(buildNodeListFilters({ status: null, type: null, region: null })).toEqual({});
  });
});
