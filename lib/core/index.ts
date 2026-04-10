/**
 * Core module public API — import from "@/lib/core"
 */

export { eventBus } from "./event-bus";
export type { EventPayload, EventHandler, EventMeta } from "./event-bus";

export { Events } from "./event-types";
export type { EventName } from "./event-types";

export {
  apiOk,
  apiCreated,
  apiList,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiConflict,
  apiBusinessError,
  zodToApiError,
  ErrorCode,
} from "./api-response";

export {
  StateMachine,
  TransitionError,
  AccountMachine,
  DealMachine,
  NodeMachine,
  TaskMachine,
  EvidenceMachine,
  PoBMachine,
  SettlementMachine,
} from "./state-machine";

export { parseBody } from "./validation";

export { initWCN } from "./init";
