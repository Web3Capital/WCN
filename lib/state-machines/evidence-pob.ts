import type { EvidenceReviewStatus, PoBEventStatus } from "@prisma/client";

const EVIDENCE_TRANSITIONS: Record<EvidenceReviewStatus, EvidenceReviewStatus[]> = {
  DRAFT:        ["SUBMITTED"],
  SUBMITTED:    ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "DISPUTED"],
  APPROVED:     [],
  REJECTED:     ["SUBMITTED"],
  DISPUTED:     ["UNDER_REVIEW", "REJECTED"],
};

export function canTransitionEvidence(from: EvidenceReviewStatus, to: EvidenceReviewStatus): boolean {
  return EVIDENCE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextEvidenceStatuses(from: EvidenceReviewStatus): EvidenceReviewStatus[] {
  return EVIDENCE_TRANSITIONS[from] ?? [];
}

const POB_TRANSITIONS: Record<PoBEventStatus, PoBEventStatus[]> = {
  CREATED:        ["PENDING_REVIEW"],
  PENDING_REVIEW: ["EFFECTIVE", "REJECTED", "FROZEN"],
  EFFECTIVE:      ["FROZEN"],
  REJECTED:       ["PENDING_REVIEW"],
  FROZEN:         ["PENDING_REVIEW", "REJECTED"],
};

export function canTransitionPoB(from: PoBEventStatus, to: PoBEventStatus): boolean {
  return POB_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextPoBStatuses(from: PoBEventStatus): PoBEventStatus[] {
  return POB_TRANSITIONS[from] ?? [];
}
