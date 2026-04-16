/**
 * @wcn/learning — Learning Loop Module (White Paper §05, component L)
 *
 * Signal collection for system-level learning and improvement.
 */

export type { LearningSignalRecord, LearningPort } from "./ports";
export {
  captureSignal,
  getUnprocessedSignals,
  markProcessed,
  getSignalStats,
  SignalTypes,
} from "./collector";
export { initLearningHandlers } from "./handlers";
