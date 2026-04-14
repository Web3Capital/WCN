import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  researchOutputSchema,
  dealMemoOutputSchema,
  meetingNotesOutputSchema,
  contentDraftOutputSchema,
  buildResearchPrompt,
  buildDealMemoPrompt,
  buildMeetingNotesPrompt,
  buildContentDraftPrompt,
  AGENT_SYSTEM_PROMPTS,
} from "../prompts";
import { estimateCost } from "../router";
import type { ProjectContext, MatchContext, DealContext } from "../types";

describe("Agent Prompts", () => {
  const mockProject: ProjectContext = {
    id: "proj-1",
    name: "DefiLend Protocol",
    sector: "DEFI",
    stage: "SEED",
    description: "Decentralized lending protocol with novel risk model",
    fundraisingNeed: 2000000,
    location: null,
    nodeName: "Alpha Node",
    milestones: ["MVP Launch", "Audit Complete"],
    evidenceCount: 5,
  };

  const mockMatch: MatchContext = {
    matchId: "match-1",
    score: 85,
    sectorScore: 90,
    stageScore: 80,
    ticketScore: 85,
    project: mockProject,
    capital: {
      id: "cap-1",
      nodeName: "Ventures Capital",
      sectors: ["DEFI", "INFRA"],
      stages: ["SEED", "PRE_A"],
      ticketMin: 500000,
      ticketMax: 3000000,
      regions: ["APAC"],
      investorType: "VC",
      instruments: ["SAFE", "SAFT"],
      aum: "$50M–$100M",
    },
  };

  const mockDeal: DealContext = {
    id: "deal-1",
    title: "DefiLend Series Seed",
    stage: "DD",
    projectName: "DefiLend Protocol",
    participants: [
      { nodeName: "Alpha Node", role: "LEAD" },
      { nodeName: "Ventures Capital", role: "INVESTOR" },
    ],
    milestones: [
      { title: "Term Sheet", done: true },
      { title: "Due Diligence", done: false },
    ],
    noteCount: 3,
  };

  describe("Research Output Schema", () => {
    it("validates a correct research output", () => {
      const valid = {
        summary: "DefiLend is a DeFi lending protocol...",
        strengths: ["Novel risk model", "Strong team"],
        risks: [{ flag: "Market competition", severity: "HIGH" as const, detail: "Crowded lending market" }],
        marketContext: "DeFi lending market is $50B...",
        competitorComparison: "Compared to Aave and Compound...",
        recommendation: "CAUTIOUS" as const,
      };
      expect(researchOutputSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects invalid recommendation", () => {
      const invalid = {
        summary: "test",
        strengths: [],
        risks: [],
        marketContext: "test",
        competitorComparison: "test",
        recommendation: "MAYBE",
      };
      expect(researchOutputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("Deal Memo Output Schema", () => {
    it("validates a correct deal memo", () => {
      const valid = {
        fitAnalysis: "Strong sector alignment...",
        keyHighlights: ["Sector match", "Ticket in range"],
        concerns: ["Early stage risk"],
        suggestedNextSteps: ["Schedule intro call"],
        memoScore: 82,
      };
      expect(dealMemoOutputSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects out-of-range memo score", () => {
      const invalid = {
        fitAnalysis: "test",
        keyHighlights: [],
        concerns: [],
        suggestedNextSteps: [],
        memoScore: 150,
      };
      expect(dealMemoOutputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("Meeting Notes Output Schema", () => {
    it("validates correct meeting notes", () => {
      const valid = {
        meetingSummary: "Discussed term sheet...",
        decisions: ["Proceed with DD"],
        actionItems: [{ description: "Send data room access", assignee: "Alpha Node", deadline: "2026-04-15", priority: "HIGH" as const }],
        followUps: ["Check legal review status"],
        nextMeetingAgenda: ["Review DD findings"],
      };
      expect(meetingNotesOutputSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("Content Draft Output Schema", () => {
    it("validates correct content draft", () => {
      const valid = {
        projectSummary: "DefiLend Protocol is revolutionizing...",
        socialPosts: [{ platform: "Twitter", content: "Introducing DefiLend...", hashtags: ["DeFi", "Web3"] }],
        distributionPlan: "Target crypto-native VCs...",
        keyMessages: ["Novel risk model", "Institutional grade"],
      };
      expect(contentDraftOutputSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("Prompt Builders", () => {
    it("builds research prompt with project data", () => {
      const prompt = buildResearchPrompt(mockProject);
      expect(prompt).toContain("DefiLend Protocol");
      expect(prompt).toContain("DEFI");
      expect(prompt).toContain("$2,000,000");
      expect(prompt).toContain("Alpha Node");
    });

    it("builds deal memo prompt with match data", () => {
      const prompt = buildDealMemoPrompt(mockMatch);
      expect(prompt).toContain("85/100");
      expect(prompt).toContain("DefiLend Protocol");
      expect(prompt).toContain("Ventures Capital");
    });

    it("builds meeting notes prompt with deal and transcript", () => {
      const prompt = buildMeetingNotesPrompt(mockDeal, "We discussed the terms...");
      expect(prompt).toContain("DefiLend Series Seed");
      expect(prompt).toContain("We discussed the terms...");
      expect(prompt).toContain("Alpha Node (LEAD)");
    });

    it("builds content draft prompt", () => {
      const prompt = buildContentDraftPrompt(mockProject, "Institutional VCs");
      expect(prompt).toContain("DefiLend Protocol");
      expect(prompt).toContain("Institutional VCs");
    });
  });

  describe("System Prompts", () => {
    it("has system prompts for all agent types", () => {
      expect(AGENT_SYSTEM_PROMPTS.RESEARCH).toContain("research");
      expect(AGENT_SYSTEM_PROMPTS.DEAL).toContain("deal");
      expect(AGENT_SYSTEM_PROMPTS.EXECUTION).toContain("execution");
      expect(AGENT_SYSTEM_PROMPTS.GROWTH).toContain("growth");
    });
  });
});

describe("LLM Cost Estimation", () => {
  it("estimates cost for gpt-4o", () => {
    const cost = estimateCost("gpt-4o", 2000);
    expect(cost).toBe(0.01);
  });

  it("estimates cost for unknown model with default rate", () => {
    const cost = estimateCost("unknown-model", 1000);
    expect(cost).toBe(0.005);
  });

  it("handles zero tokens", () => {
    expect(estimateCost("gpt-4o", 0)).toBe(0);
  });
});
