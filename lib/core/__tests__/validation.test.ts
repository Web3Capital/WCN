import { describe, it, expect } from "vitest";
import {
  cuid, email, trimmedString, positiveInt, nonNegativeDecimal, paginationSchema,
  createDealSchema, createProjectSchema, createNodeSchema, createEvidenceSchema,
  signupSchema, changePasswordSchema, parseBody, createApplicationSchema,
  createCapitalSchema, createRiskFlagSchema, triggerMatchSchema, matchActionSchema,
} from "../validation";

describe("Validation Schemas", () => {
  describe("primitive schemas", () => {
    it("cuid requires non-empty string", () => {
      expect(cuid.safeParse("abc123").success).toBe(true);
      expect(cuid.safeParse("").success).toBe(false);
    });

    it("email validates format", () => {
      expect(email.safeParse("user@example.com").success).toBe(true);
      expect(email.safeParse("not-email").success).toBe(false);
    });

    it("trimmedString trims and rejects empty", () => {
      expect(trimmedString.safeParse("  hello  ").data).toBe("hello");
      expect(trimmedString.safeParse("   ").success).toBe(false);
    });

    it("positiveInt rejects 0 and negatives", () => {
      expect(positiveInt.safeParse(1).success).toBe(true);
      expect(positiveInt.safeParse(0).success).toBe(false);
      expect(positiveInt.safeParse(-1).success).toBe(false);
    });

    it("nonNegativeDecimal accepts 0", () => {
      expect(nonNegativeDecimal.safeParse(0).success).toBe(true);
      expect(nonNegativeDecimal.safeParse(1.5).success).toBe(true);
      expect(nonNegativeDecimal.safeParse(-0.1).success).toBe(false);
    });
  });

  describe("paginationSchema", () => {
    it("applies defaults", () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.order).toBe("desc");
      }
    });

    it("coerces string numbers", () => {
      const result = paginationSchema.safeParse({ page: "3", pageSize: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it("rejects pageSize > 100", () => {
      expect(paginationSchema.safeParse({ pageSize: 200 }).success).toBe(false);
    });
  });

  describe("createDealSchema", () => {
    it("validates minimum required fields", () => {
      const result = createDealSchema.safeParse({ title: "Test Deal", leadNodeId: "node123" });
      expect(result.success).toBe(true);
    });

    it("rejects missing title", () => {
      expect(createDealSchema.safeParse({ leadNodeId: "node123" }).success).toBe(false);
    });
  });

  describe("createProjectSchema", () => {
    it("validates with name only", () => {
      const result = createProjectSchema.safeParse({ name: "My Project" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stage).toBe("OTHER");
      }
    });

    it("validates valid stage", () => {
      const result = createProjectSchema.safeParse({ name: "P", stage: "SEED" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid stage", () => {
      expect(createProjectSchema.safeParse({ name: "P", stage: "INVALID" }).success).toBe(false);
    });
  });

  describe("createNodeSchema", () => {
    it("validates required fields", () => {
      const result = createNodeSchema.safeParse({ name: "Node A", type: "REGION" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid node type", () => {
      expect(createNodeSchema.safeParse({ name: "N", type: "INVALID" }).success).toBe(false);
    });
  });

  describe("signupSchema", () => {
    it("validates valid signup", () => {
      expect(signupSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(true);
    });

    it("rejects short password", () => {
      expect(signupSchema.safeParse({ email: "a@b.com", password: "123" }).success).toBe(false);
    });
  });

  describe("createCapitalSchema", () => {
    it("validates with name", () => {
      expect(createCapitalSchema.safeParse({ name: "Fund A" }).success).toBe(true);
    });
  });

  describe("createRiskFlagSchema", () => {
    it("validates required fields", () => {
      const result = createRiskFlagSchema.safeParse({
        entityType: "Node", entityId: "n1", reason: "Suspicious",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.severity).toBe("MEDIUM");
      }
    });
  });

  describe("triggerMatchSchema", () => {
    it("validates projectId", () => {
      expect(triggerMatchSchema.safeParse({ projectId: "p1" }).success).toBe(true);
    });

    it("accepts optional weights", () => {
      const result = triggerMatchSchema.safeParse({
        projectId: "p1",
        weights: { sector: 0.5, stage: 0.3 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("matchActionSchema", () => {
    it("validates interest action", () => {
      expect(matchActionSchema.safeParse({ action: "interest" }).success).toBe(true);
    });

    it("requires dealId for convert", () => {
      expect(matchActionSchema.safeParse({ action: "convert" }).success).toBe(false);
      expect(matchActionSchema.safeParse({ action: "convert", dealId: "d1" }).success).toBe(true);
    });
  });

  describe("parseBody helper", () => {
    it("returns ok:true for valid data", () => {
      const result = parseBody(signupSchema, { email: "a@b.com", password: "12345678" });
      expect(result.ok).toBe(true);
    });

    it("returns ok:false with ZodError for invalid data", () => {
      const result = parseBody(signupSchema, { email: "bad" });
      expect(result.ok).toBe(false);
    });
  });
});
