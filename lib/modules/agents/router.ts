/**
 * @wcn/agents — LLM Router
 *
 * Unified interface over Vercel AI SDK supporting OpenAI + Anthropic.
 * Selects provider based on env config, returns structured output via Zod schemas.
 */

import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { z } from "zod";
import type { AIProvider, LLMConfig, LLMResult } from "./types";

// ─── Configuration ──────────────────────────────────────────────

function getDefaultConfig(): LLMConfig {
  return {
    provider: (process.env.AI_PROVIDER as AIProvider) || "openai",
    model: process.env.AI_PROVIDER === "anthropic"
      ? (process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514")
      : (process.env.OPENAI_MODEL || "gpt-4o"),
    maxTokens: Number(process.env.AI_MAX_TOKENS) || 4096,
    temperature: Number(process.env.AI_TEMPERATURE) || 0.3,
  };
}

function getModel(config: LLMConfig) {
  switch (config.provider) {
    case "anthropic":
      return anthropic(config.model);
    case "openai":
    default:
      return openai(config.model);
  }
}

// ─── Structured Output (Zod schema → typed JSON) ────────────────

export async function generateStructured<T>(opts: {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  config?: Partial<LLMConfig>;
}): Promise<LLMResult & { object: T }> {
  const config = { ...getDefaultConfig(), ...opts.config };
  const model = getModel(config);
  const start = Date.now();

  const result = await generateObject({
    model,
    system: opts.system,
    prompt: opts.prompt,
    schema: opts.schema,
    maxOutputTokens: config.maxTokens,
    temperature: config.temperature,
  });

  return {
    object: result.object,
    tokenCount: (result.usage?.totalTokens) ?? 0,
    modelId: config.model,
    executionTimeMs: Date.now() - start,
  };
}

// ─── Free-form Text Generation ──────────────────────────────────

export async function generateFreeText(opts: {
  system: string;
  prompt: string;
  config?: Partial<LLMConfig>;
}): Promise<LLMResult & { text: string }> {
  const config = { ...getDefaultConfig(), ...opts.config };
  const model = getModel(config);
  const start = Date.now();

  const result = await generateText({
    model,
    system: opts.system,
    prompt: opts.prompt,
    maxOutputTokens: config.maxTokens,
    temperature: config.temperature,
  });

  return {
    text: result.text,
    tokenCount: (result.usage?.totalTokens) ?? 0,
    modelId: config.model,
    executionTimeMs: Date.now() - start,
  };
}

// ─── Cost Estimation ────────────────────────────────────────────

const COST_PER_1K_TOKENS: Record<string, number> = {
  "gpt-4o": 0.005,
  "gpt-4o-mini": 0.00015,
  "gpt-4.1": 0.005,
  "gpt-4.1-mini": 0.001,
  "claude-sonnet-4-20250514": 0.006,
  "claude-3-5-sonnet-20241022": 0.006,
};

export function estimateCost(modelId: string, tokenCount: number): number {
  const rate = COST_PER_1K_TOKENS[modelId] ?? 0.005;
  return Math.round((tokenCount / 1000) * rate * 10000) / 10000;
}
