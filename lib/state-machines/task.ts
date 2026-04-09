import type { TaskStatus } from "@prisma/client";

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT:          ["ASSIGNED", "CANCELLED"],
  ASSIGNED:       ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS:    ["SUBMITTED", "BLOCKED", "CANCELLED"],
  SUBMITTED:      ["ACCEPTED", "REWORK"],
  ACCEPTED:       ["CLOSED"],
  REWORK:         ["IN_PROGRESS", "CANCELLED"],
  BLOCKED:        ["IN_PROGRESS", "CANCELLED"],
  CANCELLED:      [],
  CLOSED:         [],
  // legacy compat
  OPEN:           ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  WAITING_REVIEW: ["SUBMITTED", "ACCEPTED", "REWORK"],
  DONE:           ["CLOSED"],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextTaskStatuses(from: TaskStatus): TaskStatus[] {
  return TRANSITIONS[from] ?? [];
}
