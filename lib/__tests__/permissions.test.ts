import { describe, it, expect } from "vitest";
import { can, canAny, isAdminRole, requiresTwoFactor, getAllowedResources, type Resource, type Action } from "../permissions";
import type { Role } from "@prisma/client";

describe("Permissions (RBAC)", () => {
  describe("can", () => {
    it("ADMIN has full access to nodes", () => {
      expect(can("ADMIN" as Role, "read", "node")).toBe(true);
      expect(can("ADMIN" as Role, "create", "node")).toBe(true);
      expect(can("ADMIN" as Role, "delete", "node")).toBe(true);
      expect(can("ADMIN" as Role, "freeze", "node")).toBe(true);
    });

    it("USER has read-only access to nodes", () => {
      expect(can("USER" as Role, "read", "node")).toBe(true);
      expect(can("USER" as Role, "create", "node")).toBe(false);
      expect(can("USER" as Role, "delete", "node")).toBe(false);
    });

    it("NODE_OWNER can create and update projects", () => {
      expect(can("NODE_OWNER" as Role, "read", "project")).toBe(true);
      expect(can("NODE_OWNER" as Role, "create", "project")).toBe(true);
      expect(can("NODE_OWNER" as Role, "update", "project")).toBe(true);
      expect(can("NODE_OWNER" as Role, "delete", "project")).toBe(false);
    });

    it("REVIEWER can review evidence but not create", () => {
      expect(can("REVIEWER" as Role, "read", "evidence")).toBe(true);
      expect(can("REVIEWER" as Role, "review", "evidence")).toBe(true);
      expect(can("REVIEWER" as Role, "create", "evidence")).toBe(false);
    });

    it("FINANCE_ADMIN can manage settlements", () => {
      expect(can("FINANCE_ADMIN" as Role, "read", "settlement")).toBe(true);
      expect(can("FINANCE_ADMIN" as Role, "create", "settlement")).toBe(true);
      expect(can("FINANCE_ADMIN" as Role, "export", "settlement")).toBe(true);
    });

    it("CAPITAL_NODE can update capital profiles", () => {
      expect(can("CAPITAL_NODE" as Role, "read", "capital")).toBe(true);
      expect(can("CAPITAL_NODE" as Role, "update", "capital")).toBe(true);
      expect(can("CAPITAL_NODE" as Role, "create", "capital")).toBe(false);
    });

    it("returns false for unknown role", () => {
      expect(can("FAKE_ROLE" as Role, "read", "node")).toBe(false);
    });

    describe("policy resource", () => {
      it("FOUNDER + ADMIN + SYSTEM have full access", () => {
        for (const role of ["FOUNDER", "ADMIN", "SYSTEM"] as Role[]) {
          expect(can(role, "read", "policy")).toBe(true);
          expect(can(role, "create", "policy")).toBe(true);
          expect(can(role, "update", "policy")).toBe(true);
          expect(can(role, "delete", "policy")).toBe(true);
          expect(can(role, "manage", "policy")).toBe(true);
        }
      });

      it("REVIEWER + RISK_DESK can read and run evaluations", () => {
        for (const role of ["REVIEWER", "RISK_DESK"] as Role[]) {
          expect(can(role, "read", "policy")).toBe(true);
          expect(can(role, "review", "policy")).toBe(true);
          // But cannot create/update/delete the policy catalog itself.
          expect(can(role, "create", "policy")).toBe(false);
          expect(can(role, "update", "policy")).toBe(false);
          expect(can(role, "delete", "policy")).toBe(false);
        }
      });

      it("USER + NODE_OWNER + others have read-only", () => {
        for (const role of ["USER", "NODE_OWNER", "PROJECT_OWNER", "CAPITAL_NODE", "SERVICE_NODE", "OBSERVER"] as Role[]) {
          expect(can(role, "read", "policy")).toBe(true);
          expect(can(role, "create", "policy")).toBe(false);
          expect(can(role, "review", "policy")).toBe(false);
        }
      });
    });
  });

  describe("canAny", () => {
    it("returns true if any action is allowed", () => {
      expect(canAny("NODE_OWNER" as Role, ["read", "create"], "project")).toBe(true);
    });

    it("returns false if no action is allowed", () => {
      expect(canAny("USER" as Role, ["create", "delete"], "node")).toBe(false);
    });
  });

  describe("isAdminRole", () => {
    it("ADMIN and FOUNDER are admin roles", () => {
      expect(isAdminRole("ADMIN" as Role)).toBe(true);
      expect(isAdminRole("FOUNDER" as Role)).toBe(true);
    });

    it("other roles are not admin", () => {
      expect(isAdminRole("USER" as Role)).toBe(false);
      expect(isAdminRole("NODE_OWNER" as Role)).toBe(false);
      expect(isAdminRole("REVIEWER" as Role)).toBe(false);
    });
  });

  describe("requiresTwoFactor", () => {
    it("high-privilege roles require 2FA", () => {
      expect(requiresTwoFactor("FOUNDER" as Role)).toBe(true);
      expect(requiresTwoFactor("ADMIN" as Role)).toBe(true);
      expect(requiresTwoFactor("FINANCE_ADMIN" as Role)).toBe(true);
      expect(requiresTwoFactor("REVIEWER" as Role)).toBe(true);
      expect(requiresTwoFactor("RISK_DESK" as Role)).toBe(true);
    });

    it("low-privilege roles do not require 2FA", () => {
      expect(requiresTwoFactor("USER" as Role)).toBe(false);
      expect(requiresTwoFactor("NODE_OWNER" as Role)).toBe(false);
    });
  });

  describe("getAllowedResources", () => {
    it("returns resources for a valid role", () => {
      const resources = getAllowedResources("USER" as Role);
      expect(resources).toContain("node");
      expect(resources).toContain("notification");
    });

    it("ADMIN has many resources", () => {
      const resources = getAllowedResources("ADMIN" as Role);
      expect(resources.length).toBeGreaterThan(15);
    });

    it("returns empty for unknown role", () => {
      expect(getAllowedResources("FAKE" as Role)).toEqual([]);
    });
  });
});
