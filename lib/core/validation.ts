/**
 * Shared Zod schemas and validation utilities.
 *
 * Module-specific schemas live in lib/modules/<name>/validation.ts
 * This file contains cross-cutting schemas and helpers.
 */

import { z } from "zod";

// ─── Common Field Schemas ───────────────────────────────────────

export const cuid = z.string().min(1, "ID is required");
export const email = z.string().email("Invalid email address");
export const trimmedString = z.string().trim().min(1, "Cannot be empty");
export const optionalString = z.string().trim().nullable().optional();
export const positiveInt = z.number().int().positive();
export const nonNegativeDecimal = z.number().min(0);
export const isoDate = z.string().datetime({ message: "Invalid ISO date" });
export const optionalDate = z.string().datetime().nullable().optional();

// ─── Pagination ─────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// ─── Deal Schemas ───────────────────────────────────────────────

export const createDealSchema = z.object({
  title: trimmedString,
  leadNodeId: cuid,
  description: optionalString,
  projectId: cuid.nullable().optional(),
  capitalId: cuid.nullable().optional(),
  nextAction: optionalString,
  confidentialityLevel: z.enum(["PUBLIC", "NETWORK", "DEAL_ROOM", "RESTRICTED"]).default("DEAL_ROOM"),
});

export const updateDealSchema = z.object({
  title: trimmedString.optional(),
  description: optionalString,
  stage: z.string().optional(),
  nextAction: optionalString,
  nextActionDueAt: optionalDate,
  riskTags: z.array(z.string()).optional(),
  confidentialityLevel: z.enum(["PUBLIC", "NETWORK", "DEAL_ROOM", "RESTRICTED"]).optional(),
});

// ─── Node Schemas ───────────────────────────────────────────────

export const createNodeSchema = z.object({
  name: trimmedString,
  type: z.enum(["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"]),
  description: optionalString,
  tags: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((t) => String(t).trim()).filter(Boolean)),
  region: optionalString,
  city: optionalString,
  jurisdiction: optionalString,
  level: z.coerce.number().int().min(1).default(1),
  ownerUserId: cuid.nullable().optional(),
  entityName: optionalString,
  entityType: optionalString,
  contactName: optionalString,
  contactEmail: optionalString,
  resourcesOffered: optionalString,
  pastCases: optionalString,
  recommendation: optionalString,
  allowedServices: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((s) => String(s).trim()).filter(Boolean)),
  riskLevel: optionalString,
});

// ─── Project Schemas ────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: trimmedString,
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "SCREENED",
      "CURATED",
      "IN_DEAL_ROOM",
      "ACTIVE",
      "ON_HOLD",
      "APPROVED",
      "REJECTED",
      "ARCHIVED",
    ])
    .optional(),
  stage: z.enum(["IDEA", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PUBLIC", "OTHER"]).default("OTHER"),
  sector: optionalString,
  website: optionalString,
  pitchUrl: optionalString,
  fundraisingNeed: optionalString,
  contactName: optionalString,
  contactEmail: optionalString,
  contactTelegram: optionalString,
  description: optionalString,
  nodeId: cuid.nullable().optional(),
});

// ─── Task Schemas ───────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: trimmedString,
  type: z.enum(["FUNDRAISING", "GROWTH", "RESOURCE", "LIQUIDITY", "RESEARCH", "EXECUTION", "OTHER"]),
  description: optionalString,
  projectId: cuid.nullable().optional(),
  ownerNodeId: cuid.nullable().optional(),
  dealId: cuid.nullable().optional(),
  assigneeUserId: cuid.nullable().optional(),
  acceptanceOwner: optionalString,
  evidenceRequired: z.array(z.string()).default([]),
  dueAt: optionalDate,
  assignNodeIds: z.array(cuid).default([]),
});

// ─── Evidence Schemas ───────────────────────────────────────────

export const createEvidenceSchema = z.object({
  type: z.enum(["CONTRACT", "TRANSFER", "REPORT", "SCREENSHOT", "LINK", "ONCHAIN_TX", "OTHER"]).default("OTHER"),
  title: optionalString,
  summary: optionalString,
  url: optionalString,
  onchainTx: optionalString,
  fileId: cuid.nullable().optional(),
  hash: optionalString,
  taskId: cuid.nullable().optional(),
  projectId: cuid.nullable().optional(),
  nodeId: cuid.nullable().optional(),
  dealId: cuid.nullable().optional(),
  submit: z.boolean().default(false),
});

// ─── Settlement Schemas ─────────────────────────────────────────

export const createSettlementCycleSchema = z.object({
  kind: z.enum(["WEEK", "MONTH"]),
  startAt: isoDate,
  endAt: isoDate,
  pool: nonNegativeDecimal,
});

// ─── Application Schema ─────────────────────────────────────────

export const createApplicationSchema = z.object({
  applicantName: trimmedString,
  contact: trimmedString,
  organization: optionalString,
  role: optionalString,
  nodeType: optionalString,
  resources: optionalString,
  lookingFor: optionalString,
  linkedin: optionalString,
  whyWcn: optionalString,
});

// ─── Risk Schemas ───────────────────────────────────────────────

export const createRiskFlagSchema = z.object({
  entityType: trimmedString,
  entityId: trimmedString,
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  reason: trimmedString,
});

export const updateRiskFlagSchema = z.object({
  resolution: z.string().nullable().optional(),
  resolve: z.boolean().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  freeze: z.boolean().optional(),
  freezeLevel: z.enum(["SOFT", "HARD"]).optional(),
});

// ─── Entity Freeze Schemas ──────────────────────────────────────

export const createEntityFreezeSchema = z.object({
  workspaceId: trimmedString,
  entityType: trimmedString,
  entityId: trimmedString,
  freezeLevel: z.enum(["SOFT", "HARD"]),
  reason: trimmedString,
  expiresAt: optionalDate,
});

export const liftEntityFreezeSchema = z.object({
  reason: optionalString,
});

// ─── Access Grant Schemas ───────────────────────────────────────

export const createAccessGrantSchema = z.object({
  workspaceId: trimmedString,
  entityType: trimmedString,
  entityId: trimmedString,
  grantedToType: trimmedString,
  grantedToId: trimmedString,
  grantType: trimmedString,
  scope: z.string().default("FULL"),
  expiresAt: optionalDate,
});

// ─── Terms Schema ───────────────────────────────────────────────

export const acceptTermsSchema = z.object({
  documentType: z.enum(["NDA", "TERMS", "PRIVACY", "CODE_OF_CONDUCT"]),
  documentVer: z.string().default("1.0"),
  workspaceId: optionalString,
});

// ─── Workspace Schemas ──────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: trimmedString,
  slug: z.string().trim().min(1).transform((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
  description: optionalString,
});

export const addWorkspaceMemberSchema = z.object({
  userId: cuid,
  role: z.string().default("USER"),
  territory: optionalString,
  region: optionalString,
});

// ─── Invite Schemas ─────────────────────────────────────────────

export const createInviteSchema = z.object({
  email: email,
  role: z.string().default("NODE_OWNER"),
  expiresInDays: z.coerce.number().int().min(1).max(90).default(7),
  workspaceId: optionalString,
});

// ─── Notification Schemas ───────────────────────────────────────

export const notificationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("markAllRead") }),
  z.object({ action: z.literal("markRead"), id: cuid }),
]);

// ─── Search Index Schema ────────────────────────────────────────

export const createSearchDocumentSchema = z.object({
  workspaceId: trimmedString,
  entityType: trimmedString,
  entityId: trimmedString,
  title: trimmedString,
  subtitle: optionalString,
  bodyText: optionalString,
  tags: z.array(z.string()).default([]),
});

// ─── Capital Schemas ────────────────────────────────────────────

export const createCapitalSchema = z.object({
  name: trimmedString,
  entity: optionalString,
  investmentFocus: z.array(z.string()).default([]),
  ticketMin: z.number().nullable().optional(),
  ticketMax: z.number().nullable().optional(),
  jurisdictionLimit: z.array(z.string()).default([]),
  structurePref: z.array(z.string()).default([]),
  blacklist: z.array(z.string()).default([]),
  restrictions: optionalString,
  contactName: optionalString,
  contactEmail: optionalString,
  notes: optionalString,
  nodeId: optionalString,
});

export const updateCapitalSchema = z.object({
  name: optionalString,
  entity: optionalString,
  status: z.string().optional(),
  investmentFocus: z.array(z.string()).optional(),
  ticketMin: z.number().nullable().optional(),
  ticketMax: z.number().nullable().optional(),
  jurisdictionLimit: z.array(z.string()).optional(),
  structurePref: z.array(z.string()).optional(),
  blacklist: z.array(z.string()).optional(),
  restrictions: optionalString,
  contactName: optionalString,
  contactEmail: optionalString,
  notes: optionalString,
  nodeId: optionalString,
  responseSpeed: z.number().nullable().optional(),
  activityScore: z.number().nullable().optional(),
});

// ─── Auth / Account Schemas ─────────────────────────────────────

export const signupSchema = z.object({
  name: optionalString,
  email: email,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const verify2FASchema = z.object({
  code: z.string().length(6, "6-digit code required"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

// ─── Dispute Schemas ────────────────────────────────────────────

export const createDisputeSchema = z.object({
  reason: trimmedString,
  targetType: z.enum(["NODE", "PROJECT", "TASK", "POB", "APPLICATION", "EVIDENCE"]),
  targetId: trimmedString,
  pobId: optionalString,
});

export const updateDisputeSchema = z.object({
  status: z.enum(["OPEN", "UPHELD", "DISMISSED"]).optional(),
  resolution: optionalString,
});

// ─── Approval Schemas ───────────────────────────────────────────

export const createApprovalSchema = z.object({
  workspaceId: trimmedString,
  entityType: trimmedString,
  entityId: trimmedString,
  actionType: trimmedString,
  reason: optionalString,
});

export const updateApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: optionalString,
});

// ─── File Schemas ───────────────────────────────────────────────

export const createFileSchema = z.object({
  filename: trimmedString,
  mimeType: trimmedString,
  sizeBytes: z.number().int().min(0),
  workspaceId: optionalString,
  dealId: optionalString,
  projectId: optionalString,
  nodeId: optionalString,
  entityType: optionalString,
  entityId: optionalString,
  accessLevel: z.enum(["PRIVATE", "DEAL_ROOM", "WORKSPACE", "PUBLIC"]).default("PRIVATE"),
});

export const completeUploadSchema = z.object({
  storageKey: trimmedString,
  hash: optionalString,
});

// ─── Deal Sub-resource Schemas ──────────────────────────────────

export const createDealNoteSchema = z.object({
  content: trimmedString,
  visibility: z.enum(["INTERNAL", "SHARED"]).default("INTERNAL"),
});

export const addDealParticipantSchema = z.object({
  nodeId: cuid,
  role: z.string().default("PARTICIPANT"),
});

export const createDealMilestoneSchema = z.object({
  title: trimmedString,
  dueAt: optionalDate,
  description: optionalString,
});

export const updateDealMilestoneSchema = z.object({
  title: trimmedString.optional(),
  status: z.enum(["PENDING", "COMPLETED", "SKIPPED"]).optional(),
  completedAt: optionalDate,
});

// ─── Application Schemas ────────────────────────────────────────

export const reviewApplicationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: optionalString,
  nodeType: optionalString,
});

// ─── Agent Schemas ──────────────────────────────────────────────

export const createAgentSchema = z.object({
  name: trimmedString,
  type: z.enum(["RESEARCH", "DEAL", "EXECUTION", "GROWTH"]),
  description: optionalString,
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateAgentSchema = z.object({
  name: trimmedString.optional(),
  description: optionalString,
  status: z.enum(["ACTIVE", "PAUSED", "SUSPENDED", "RETIRED"]).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const createAgentRunSchema = z.object({
  agentId: cuid,
  input: z.record(z.string(), z.unknown()).optional(),
  triggerType: z.enum(["MANUAL", "EVENT", "SCHEDULED"]).default("MANUAL"),
});

export const agentPermissionSchema = z.object({
  resource: trimmedString,
  action: trimmedString,
});

// ─── Node Sub-resource Schemas ──────────────────────────────────

export const createNodePenaltySchema = z.object({
  type: trimmedString,
  reason: trimmedString,
  amount: z.number().min(0).optional(),
  expiresAt: optionalDate,
});

export const createNodeStakeSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().default("USDC"),
  txHash: optionalString,
});

export const createNodeSeatSchema = z.object({
  userId: cuid,
  role: z.string().default("OPERATOR"),
});

// ─── PoB Schemas ────────────────────────────────────────────────

export const createPoBSchema = z.object({
  dealId: cuid,
  nodeId: cuid,
  businessType: z.string().default("FUNDRAISING"),
  businessAmount: z.number().min(0).optional(),
  valueCurrency: z.string().default("USD"),
  notes: optionalString,
});

export const updatePoBSchema = z.object({
  status: z.string().optional(),
  score: z.number().optional(),
  notes: optionalString,
});

export const createPoBConfirmationSchema = z.object({
  pobId: cuid,
  confirmationType: z.string().default("NODE"),
  notes: optionalString,
});

export const createPoBAttributionSchema = z.object({
  pobId: cuid,
  nodeId: cuid,
  role: trimmedString,
  percentage: z.number().min(0).max(100),
});

// ─── Settlement Extra Schemas ───────────────────────────────────

export const settlementLockSchema = z.object({
  dualControl: z.boolean().default(false),
  reason: optionalString,
});

// ─── Update Project Schema ──────────────────────────────────────

export const updateProjectSchema = z.object({
  name: trimmedString.optional(),
  status: z
    .enum([
      "DRAFT", "SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM",
      "ACTIVE", "ON_HOLD", "APPROVED", "REJECTED", "ARCHIVED",
    ])
    .optional(),
  stage: z.enum(["IDEA", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PUBLIC", "OTHER"]).optional(),
  sector: optionalString,
  website: optionalString,
  pitchUrl: optionalString,
  fundraisingNeed: optionalString,
  contactName: optionalString,
  contactEmail: optionalString,
  contactTelegram: optionalString,
  description: optionalString,
  nodeId: optionalString,
});

// ─── Update Node Schema ─────────────────────────────────────────

export const updateNodeSchema = z.object({
  name: trimmedString.optional(),
  status: z.string().optional(),
  description: optionalString,
  tags: z.array(z.string()).optional(),
  region: optionalString,
  city: optionalString,
  jurisdiction: optionalString,
  level: z.coerce.number().int().min(1).optional(),
  entityName: optionalString,
  entityType: optionalString,
  contactName: optionalString,
  contactEmail: optionalString,
  resourcesOffered: optionalString,
  pastCases: optionalString,
  recommendation: optionalString,
  allowedServices: z.array(z.string()).optional(),
  riskLevel: optionalString,
});

// ─── Update Task Schema ─────────────────────────────────────────

export const updateTaskSchema = z.object({
  title: trimmedString.optional(),
  status: z.string().optional(),
  description: optionalString,
  output: optionalString,
  assigneeUserId: optionalString,
  reviewNote: optionalString,
  dueAt: optionalDate,
});

// ─── Update Evidence Schema ─────────────────────────────────────

export const updateEvidenceSchema = z.object({
  reviewStatus: z.string().optional(),
  reviewNote: optionalString,
  title: optionalString,
  summary: optionalString,
  url: optionalString,
  submit: z.boolean().optional(),
});

// ─── Workspace Role Schemas ─────────────────────────────────────

export const assignWorkspaceRoleSchema = z.object({
  membershipId: cuid,
  role: trimmedString,
});

export const revokeWorkspaceRoleSchema = z.object({
  assignmentId: cuid,
});

// ─── Invite Activation Schema ───────────────────────────────────

export const activateInviteSchema = z.object({
  name: trimmedString,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Matching Engine Schemas ─────────────────────────────────────

export const triggerMatchSchema = z.object({
  projectId: cuid,
  weights: z.object({
    sector: z.number().min(0).max(1).optional(),
    stage: z.number().min(0).max(1).optional(),
    ticket: z.number().min(0).max(1).optional(),
    jurisdiction: z.number().min(0).max(1).optional(),
  }).optional(),
});

export const matchActionSchema = z.object({
  action: z.enum(["interest", "decline", "convert"]),
  dealId: z.string().optional(), // required for "convert"
}).refine(
  (d) => d.action !== "convert" || !!d.dealId,
  { message: "dealId is required when action is 'convert'", path: ["dealId"] },
);

export const listMatchesQuerySchema = z.object({
  projectId: z.string().optional(),
  capitalProfileId: z.string().optional(),
  capitalNodeId: z.string().optional(),
  status: z.enum(["GENERATED", "INTEREST_EXPRESSED", "DECLINED", "CONVERTED_TO_DEAL", "EXPIRED"]).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

// ─── Helper: Parse or return error ──────────────────────────────

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { ok: true; data: T } | { ok: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error };
}
