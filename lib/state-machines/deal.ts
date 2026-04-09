import type { DealStage } from "@prisma/client";

const TRANSITIONS: Record<DealStage, DealStage[]> = {
  SOURCED:      ["MATCHED", "PASSED"],
  MATCHED:      ["INTRO_SENT", "PASSED"],
  INTRO_SENT:   ["MEETING_DONE", "PASSED"],
  MEETING_DONE: ["DD", "PASSED", "PAUSED"],
  DD:           ["TERM_SHEET", "PASSED", "PAUSED"],
  TERM_SHEET:   ["SIGNED", "PASSED", "PAUSED"],
  SIGNED:       ["FUNDED", "PASSED", "PAUSED"],
  FUNDED:       [],
  PASSED:       [],
  PAUSED:       ["DD", "TERM_SHEET", "SIGNED", "PASSED"],
};

export function canTransitionDeal(from: DealStage, to: DealStage): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextDealStages(from: DealStage): DealStage[] {
  return TRANSITIONS[from] ?? [];
}
