/**
 * @wcn/policy — Policy Engine Module (White Paper §13)
 *
 * Generalized policy evaluation engine with condition testing,
 * action dispatch, versioning, and audit trail.
 */

export type { PolicyRecord, PolicyEvaluationRecord, PolicyCondition, PolicyAction, PolicyPort } from "./ports";
export {
  createPolicy,
  activatePolicy,
  suspendPolicy,
  retirePolicy,
  evaluatePolicy,
  evaluateAllPolicies,
  BUILTIN_POLICIES,
} from "./engine";
export { initPolicyHandlers } from "./handlers";
