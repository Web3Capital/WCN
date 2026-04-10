import type { AgentType } from "@prisma/client";

// ─── LLM Router ─────────────────────────────────────────────────

export type AIProvider = "openai" | "anthropic";

export interface LLMConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface LLMResult {
  text?: string;
  object?: unknown;
  tokenCount: number;
  modelId: string;
  executionTimeMs: number;
}

// ─── Agent Execution ────────────────────────────────────────────

export interface AgentRunInput {
  agentId: string;
  agentType: AgentType;
  triggeredBy: string;
  outputType: string;
  params: Record<string, unknown>;
}

export interface AgentRunResult {
  runId: string;
  agentId: string;
  status: "SUCCESS" | "FAILED";
  outputType: string;
  outputs: unknown;
  reviewStatus: string;
  tokenCount: number;
  executionTimeMs: number;
  modelId: string;
  cost: number | null;
}

// ─── Context ────────────────────────────────────────────────────

export interface ProjectContext {
  id: string;
  name: string;
  sector: string | null;
  stage: string | null;
  description: string | null;
  fundraisingNeed: number | null;
  location: string | null;
  nodeName: string | null;
  milestones: string[];
  evidenceCount: number;
}

export interface CapitalContext {
  id: string;
  nodeName: string | null;
  sectors: string[];
  stages: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  regions: string[];
  investorType: string | null;
}

export interface DealContext {
  id: string;
  title: string;
  stage: string;
  projectName: string | null;
  participants: { nodeName: string; role: string }[];
  milestones: { title: string; done: boolean }[];
  noteCount: number;
}

export interface MatchContext {
  matchId: string;
  score: number;
  sectorScore: number;
  stageScore: number;
  ticketScore: number;
  project: ProjectContext;
  capital: CapitalContext;
}

// ─── Output Schemas (typed for each agent) ──────────────────────

export interface ResearchOutput {
  summary: string;
  strengths: string[];
  risks: { flag: string; severity: "LOW" | "MEDIUM" | "HIGH"; detail: string }[];
  marketContext: string;
  competitorComparison: string;
  recommendation: "PROCEED" | "CAUTIOUS" | "PASS";
}

export interface DealMemoOutput {
  fitAnalysis: string;
  keyHighlights: string[];
  concerns: string[];
  suggestedNextSteps: string[];
  memoScore: number;
}

export interface MeetingNotesOutput {
  meetingSummary: string;
  decisions: string[];
  actionItems: { description: string; assignee: string; deadline: string; priority: "HIGH" | "MEDIUM" | "LOW" }[];
  followUps: string[];
  nextMeetingAgenda: string[];
}

export interface ContentDraftOutput {
  projectSummary: string;
  socialPosts: { platform: string; content: string; hashtags: string[] }[];
  distributionPlan: string;
  keyMessages: string[];
}

export type AgentOutput = ResearchOutput | DealMemoOutput | MeetingNotesOutput | ContentDraftOutput;
