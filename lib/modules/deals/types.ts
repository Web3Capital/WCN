/**
 * @wcn/deals — Domain Types
 */
export type { DealRecord, DealListItem, DealDetail, DealCreateInput, DealUpdateData, DealPort } from "./ports";

export interface ListDealsParams {
  stage?: string;
  isAdmin: boolean;
  userId: string;
}

export interface UpdateDealInput {
  title?: string;
  description?: string | null;
  stage?: string;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  riskTags?: string[];
  confidentialityLevel?: string;
}
