/**
 * WCN Domain Event Type Definitions
 *
 * Every domain event in the system is defined here with its payload type.
 * Naming convention: {entity}.{past_tense_verb}
 */

// ─── Identity (M01) ───────────────────────────────────────────────

export interface UserCreatedEvent {
  userId: string;
  email: string;
  role: string;
}

export interface UserLoginEvent {
  userId: string;
  ip?: string;
  device?: string;
  method: "credentials" | "google" | "github" | "apple" | "azure-ad";
}

export interface UserLoginFailedEvent {
  email: string;
  ip?: string;
  attemptCount: number;
}

export interface UserRoleChangedEvent {
  userId: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}

export interface UserSuspendedEvent {
  userId: string;
  reason: string;
  suspendedBy: string;
}

// ─── Nodes (M02) ──────────────────────────────────────────────────

export interface NodeCreatedEvent {
  nodeId: string;
  type: string;
  name: string;
  ownerId?: string;
}

export interface NodeActivatedEvent {
  nodeId: string;
  activatedBy: string;
}

export interface NodeSuspendedEvent {
  nodeId: string;
  reason: string;
  suspendedBy: string;
}

export interface NodeStatusChangedEvent {
  nodeId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

export interface ApplicationSubmittedEvent {
  applicationId: string;
  applicantName: string;
  nodeType?: string;
}

export interface ApplicationApprovedEvent {
  applicationId: string;
  nodeId: string;
  approvedBy: string;
}

// ─── Projects (M04) ──────────────────────────────────────────────

export interface ProjectCreatedEvent {
  projectId: string;
  nodeId?: string;
  name: string;
  sector?: string;
  stage?: string;
}

export interface ProjectUpdatedEvent {
  projectId: string;
  changedFields: string[];
}

export interface ProjectStatusChangedEvent {
  projectId: string;
  oldStatus: string;
  newStatus: string;
}

// ─── Capital (M05) ────────────────────────────────────────────────

export interface MatchGeneratedEvent {
  matchId: string;
  projectId: string;
  capitalNodeId: string;
  score: number;
}

export interface MatchDeclinedEvent {
  matchId: string;
  projectId: string;
  capitalProfileId: string;
  declinedBy: string;
}

export interface MatchConvertedEvent {
  matchId: string;
  projectId: string;
  capitalProfileId: string;
  dealId: string;
}

export interface CapitalProfileUpdatedEvent {
  capitalProfileId: string;
  nodeId: string;
  changedFields: string[];
}

// ─── Deals (M06) ─────────────────────────────────────────────────

export interface DealCreatedEvent {
  dealId: string;
  projectId?: string;
  leadNodeId: string;
  dealType?: string;
  title: string;
}

export interface DealStageChangedEvent {
  dealId: string;
  oldStage: string;
  newStage: string;
  changedBy: string;
}

export interface DealParticipantAddedEvent {
  dealId: string;
  nodeId: string;
  userId?: string;
  role: string;
}

export interface DealClosedEvent {
  dealId: string;
  outcome: "FUNDED" | "PASSED";
  totalAmount?: number;
  projectId?: string;
}

// ─── Tasks (M07) ─────────────────────────────────────────────────

export interface TaskCreatedEvent {
  taskId: string;
  dealId?: string;
  title: string;
  assigneeType?: "HUMAN" | "AGENT";
}

export interface TaskAssignedEvent {
  taskId: string;
  assigneeId?: string;
  assigneeNodeId?: string;
}

export interface TaskCompletedEvent {
  taskId: string;
  dealId?: string;
  outputs?: string[];
}

export interface TaskOverdueEvent {
  taskId: string;
  assigneeId?: string;
  dueDate: string;
}

// ─── Agents (M08) ────────────────────────────────────────────────

export interface AgentRunStartedEvent {
  runId: string;
  agentId: string;
  agentType: string;
  triggeredBy: string;
}

export interface AgentOutputGeneratedEvent {
  runId: string;
  agentId: string;
  outputType: string;
}

export interface AgentOutputReviewedEvent {
  runId: string;
  reviewStatus: "APPROVED" | "MODIFIED" | "REJECTED";
  reviewedBy: string;
}

// ─── Proof Desk (M09) ────────────────────────────────────────────

export interface EvidencePacketCreatedEvent {
  packetId: string;
  dealId: string;
}

export interface EvidenceSubmittedEvent {
  evidenceId: string;
  submittedBy: string;
}

export interface EvidenceApprovedEvent {
  evidenceId: string;
  dealId?: string;
  reviewerId: string;
}

export interface EvidenceRejectedEvent {
  evidenceId: string;
  reason: string;
  reviewerId: string;
}

// ─── PoB (M10) ───────────────────────────────────────────────────

export interface PoBCreatedEvent {
  pobId: string;
  dealId?: string;
  projectId?: string;
  nodeId?: string;
  score?: number;
  totalValue?: number;
  attributions: Array<{ nodeId: string; percentage: number }>;
}

export interface PoBFlaggedEvent {
  pobId: string;
  reason: string;
  flaggedBy: string;
}

export interface PoBDisputeRaisedEvent {
  disputeId: string;
  pobId: string;
  raisedBy: string;
}

// ─── Settlement (M11) ────────────────────────────────────────────

export interface SettlementCycleCreatedEvent {
  cycleId: string;
  periodStart: string;
  periodEnd: string;
}

export interface SettlementCalculatedEvent {
  cycleId: string;
  totalEntries: number;
  totalAmount: number;
}

export interface SettlementApprovedEvent {
  cycleId: string;
  approvedBy: string;
}

export interface SettlementDistributedEvent {
  cycleId: string;
  totalDistributed: number;
  nodeCount: number;
}

// ─── Governance (M03) ────────────────────────────────────────────

export interface ApprovalRequestedEvent {
  approvalId: string;
  action: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
}

export interface ApprovalGrantedEvent {
  approvalId: string;
  grantedBy: string;
}

export interface EntityFrozenEvent {
  entityType: string;
  entityId: string;
  frozenBy: string;
  reason: string;
}

// ─── Risk (M15) ──────────────────────────────────────────────────

export interface RiskAlertCreatedEvent {
  alertId: string;
  ruleId?: string;
  entityType: string;
  entityId: string;
  severity: string;
  reason?: string;
}

// ─── Policy (White Paper §13) ───────────────────────────────────

export interface PolicyCreatedEvent {
  policyId: string;
  scope: string;
  name: string;
  createdBy: string;
}

export interface PolicyStatusChangedEvent {
  policyId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

export interface PolicyEvaluatedEvent {
  policyId: string;
  entityType: string;
  entityId: string;
  result: "PASS" | "FAIL" | "WARN";
}

// ─── Ledger (White Paper §12) ───────────────────────────────────

export interface LedgerEntryCreatedEvent {
  entryId: string;
  nodeId: string;
  type: string;
  action: string;
  amount: number;
  reference?: string;
}

// ─── Learning Loop (White Paper §05, component L) ───────────────

export interface LearningSignalCapturedEvent {
  signalId: string;
  signalType: string;
  sourceEvent: string;
  entityType: string;
  entityId: string;
}

// ─── Event Name Constants ────────────────────────────────────────

export const Events = {
  // Identity
  USER_CREATED: "user.created",
  USER_LOGIN: "user.login",
  USER_LOGIN_FAILED: "user.login_failed",
  USER_ROLE_CHANGED: "user.role_changed",
  USER_SUSPENDED: "user.suspended",
  USER_STATUS_CHANGED: "user.status_changed",

  // Nodes
  NODE_CREATED: "node.created",
  NODE_ACTIVATED: "node.activated",
  NODE_SUSPENDED: "node.suspended",
  NODE_STATUS_CHANGED: "node.status_changed",
  APPLICATION_SUBMITTED: "application.submitted",
  APPLICATION_APPROVED: "application.approved",

  // Projects
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  PROJECT_STATUS_CHANGED: "project.status_changed",

  // Capital & Matching
  MATCH_GENERATED: "match.generated",
  MATCH_DECLINED: "match.declined",
  MATCH_CONVERTED: "match.converted",
  CAPITAL_PROFILE_UPDATED: "capital.profile_updated",

  // Deals
  DEAL_CREATED: "deal.created",
  DEAL_STAGE_CHANGED: "deal.stage_changed",
  DEAL_PARTICIPANT_ADDED: "deal.participant_added",
  DEAL_CLOSED: "deal.closed",

  // Tasks
  TASK_CREATED: "task.created",
  TASK_ASSIGNED: "task.assigned",
  TASK_COMPLETED: "task.completed",
  TASK_OVERDUE: "task.overdue",

  // Agents
  AGENT_RUN_STARTED: "agent.run_started",
  AGENT_OUTPUT_GENERATED: "agent.output_generated",
  AGENT_OUTPUT_REVIEWED: "agent.output_reviewed",

  // Proof Desk
  EVIDENCE_PACKET_CREATED: "evidence.packet_created",
  EVIDENCE_SUBMITTED: "evidence.submitted",
  EVIDENCE_APPROVED: "evidence.approved",
  EVIDENCE_REJECTED: "evidence.rejected",

  // PoB
  POB_CREATED: "pob.created",
  POB_FLAGGED: "pob.flagged",
  POB_DISPUTE_RAISED: "pob.dispute_raised",

  // Settlement
  SETTLEMENT_CYCLE_CREATED: "settlement.cycle_created",
  SETTLEMENT_CALCULATED: "settlement.calculated",
  SETTLEMENT_APPROVED: "settlement.approved",
  SETTLEMENT_DISTRIBUTED: "settlement.distributed",

  // Governance
  APPROVAL_REQUESTED: "approval.requested",
  APPROVAL_GRANTED: "approval.granted",
  ENTITY_FROZEN: "entity.frozen",

  // Risk
  RISK_ALERT_CREATED: "risk.alert_created",

  // Policy (White Paper §13)
  POLICY_CREATED: "policy.created",
  POLICY_STATUS_CHANGED: "policy.status_changed",
  POLICY_EVALUATED: "policy.evaluated",

  // Ledger (White Paper §12)
  LEDGER_ENTRY_CREATED: "ledger.entry_created",

  // Learning Loop (White Paper §05)
  LEARNING_SIGNAL_CAPTURED: "learning.signal_captured",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

// ─── Type-Safe Event Map ────────────────────────────────────────
// Maps each event name constant to its payload interface.
// Used by DomainEventBus to enforce payload shapes at compile time.

export interface UserStatusChangedEvent {
  userId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

export interface EventMap {
  // Identity
  [Events.USER_CREATED]: UserCreatedEvent;
  [Events.USER_LOGIN]: UserLoginEvent;
  [Events.USER_LOGIN_FAILED]: UserLoginFailedEvent;
  [Events.USER_ROLE_CHANGED]: UserRoleChangedEvent;
  [Events.USER_SUSPENDED]: UserSuspendedEvent;
  [Events.USER_STATUS_CHANGED]: UserStatusChangedEvent;

  // Nodes
  [Events.NODE_CREATED]: NodeCreatedEvent;
  [Events.NODE_ACTIVATED]: NodeActivatedEvent;
  [Events.NODE_SUSPENDED]: NodeSuspendedEvent;
  [Events.NODE_STATUS_CHANGED]: NodeStatusChangedEvent;
  [Events.APPLICATION_SUBMITTED]: ApplicationSubmittedEvent;
  [Events.APPLICATION_APPROVED]: ApplicationApprovedEvent;

  // Projects
  [Events.PROJECT_CREATED]: ProjectCreatedEvent;
  [Events.PROJECT_UPDATED]: ProjectUpdatedEvent;
  [Events.PROJECT_STATUS_CHANGED]: ProjectStatusChangedEvent;

  // Capital & Matching
  [Events.MATCH_GENERATED]: MatchGeneratedEvent;
  [Events.MATCH_DECLINED]: MatchDeclinedEvent;
  [Events.MATCH_CONVERTED]: MatchConvertedEvent;
  [Events.CAPITAL_PROFILE_UPDATED]: CapitalProfileUpdatedEvent;

  // Deals
  [Events.DEAL_CREATED]: DealCreatedEvent;
  [Events.DEAL_STAGE_CHANGED]: DealStageChangedEvent;
  [Events.DEAL_PARTICIPANT_ADDED]: DealParticipantAddedEvent;
  [Events.DEAL_CLOSED]: DealClosedEvent;

  // Tasks
  [Events.TASK_CREATED]: TaskCreatedEvent;
  [Events.TASK_ASSIGNED]: TaskAssignedEvent;
  [Events.TASK_COMPLETED]: TaskCompletedEvent;
  [Events.TASK_OVERDUE]: TaskOverdueEvent;

  // Agents
  [Events.AGENT_RUN_STARTED]: AgentRunStartedEvent;
  [Events.AGENT_OUTPUT_GENERATED]: AgentOutputGeneratedEvent;
  [Events.AGENT_OUTPUT_REVIEWED]: AgentOutputReviewedEvent;

  // Proof Desk
  [Events.EVIDENCE_PACKET_CREATED]: EvidencePacketCreatedEvent;
  [Events.EVIDENCE_SUBMITTED]: EvidenceSubmittedEvent;
  [Events.EVIDENCE_APPROVED]: EvidenceApprovedEvent;
  [Events.EVIDENCE_REJECTED]: EvidenceRejectedEvent;

  // PoB
  [Events.POB_CREATED]: PoBCreatedEvent;
  [Events.POB_FLAGGED]: PoBFlaggedEvent;
  [Events.POB_DISPUTE_RAISED]: PoBDisputeRaisedEvent;

  // Settlement
  [Events.SETTLEMENT_CYCLE_CREATED]: SettlementCycleCreatedEvent;
  [Events.SETTLEMENT_CALCULATED]: SettlementCalculatedEvent;
  [Events.SETTLEMENT_APPROVED]: SettlementApprovedEvent;
  [Events.SETTLEMENT_DISTRIBUTED]: SettlementDistributedEvent;

  // Governance
  [Events.APPROVAL_REQUESTED]: ApprovalRequestedEvent;
  [Events.APPROVAL_GRANTED]: ApprovalGrantedEvent;
  [Events.ENTITY_FROZEN]: EntityFrozenEvent;

  // Risk
  [Events.RISK_ALERT_CREATED]: RiskAlertCreatedEvent;

  // Policy
  [Events.POLICY_CREATED]: PolicyCreatedEvent;
  [Events.POLICY_STATUS_CHANGED]: PolicyStatusChangedEvent;
  [Events.POLICY_EVALUATED]: PolicyEvaluatedEvent;

  // Ledger
  [Events.LEDGER_ENTRY_CREATED]: LedgerEntryCreatedEvent;

  // Learning
  [Events.LEARNING_SIGNAL_CAPTURED]: LearningSignalCapturedEvent;
}
