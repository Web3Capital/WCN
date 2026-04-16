# 11. Formal System Definition Mapping

> WCN White Paper v3.0 §05 — `WCN = (I, N, R, D, T, P, S, G, A, L, X)`

This document maps each component of the formal system definition to its codebase implementation.

## Component Map

| Symbol | White Paper Name | Codebase Implementation | Key Files |
|--------|-----------------|------------------------|-----------|
| **I** | Identity Primitives | `User` model, `KYCRecord`, `NodeCategory` enum (HUMAN/ORG/AGENT/OPERATOR) | `prisma/schema.prisma`, `lib/modules/identity/`, `lib/auth.ts` |
| **N** | Nodes | `Node` model with `category` (identity type) + `scope` (geographic/functional), `NodeStatus` state machine | `prisma/schema.prisma`, `lib/modules/nodes/`, `lib/core/state-machine.ts` |
| **R** | Relations | `DealParticipant`, `Relation` edges, `Match`, capability/relation/node graphs | `lib/modules/matching/`, `lib/modules/nodes/territory.ts` |
| **D** | Deals | `Deal` model, `DealMachine` (SOURCED→FUNDED), `DealParticipant`, `DealMilestone` | `prisma/schema.prisma`, `lib/modules/deals/`, `lib/core/state-machine.ts` |
| **T** | Tasks | `Task` model, `TaskMachine` (DRAFT→CLOSED), `TaskAssignment`, 6 task types | `prisma/schema.prisma`, `lib/core/state-machine.ts` |
| **P** | Proofs | `Evidence` (9 types), `PoBRecord` (v1+v3 scoring), `Attribution`, `Confirmation` | `lib/modules/evidence/`, `lib/modules/pob/attribution.ts` |
| **S** | Settlement | `SettlementCycle`, `SettlementLine`, `Ledger` (3-type: CASH/RIGHTS/INCENTIVE), `PaymentExecution` | `lib/modules/settlement/`, `lib/modules/ledger/`, `lib/modules/payment/` |
| **G** | Governance | `Policy` (engine + state machine), `Proposal`, `Vote`, `Council`, RBAC+ABAC permissions | `lib/modules/policy/`, `lib/modules/governance/`, `lib/permissions.ts` |
| **A** | Agents | `Agent` (5 types), `AgentRun`, `AgentPermission`, autonomy levels (L0-L3), augmented node resolver | `lib/modules/agents/`, `lib/modules/augmented-node/` |
| **L** | Learning Loop | `LearningSignal` model, signal collector, event-driven capture (match feedback, score adjustment, policy override, attribution dispute) | `lib/modules/learning/` |
| **X** | Infrastructure | PostgreSQL (Prisma), Redis (Upstash), S3, `EventBus`, `Outbox`, `StateMachine`, `EntityGuard`, `Metrics` | `lib/core/`, `lib/prisma.ts`, `lib/redis.ts`, `lib/modules/storage/` |

## White Paper Invariants → Code Enforcement

| Invariant | White Paper Section | Code Location |
|-----------|-------------------|---------------|
| No Proof, no settlement | §11 | `lib/modules/settlement/calculator.ts` — only EFFECTIVE+APPROVED PoB records enter calculation |
| No self-validation | §06 | `lib/modules/policy/engine.ts` — `NO_SELF_VALIDATION` built-in policy |
| Critical funds require approval | §06 | `lib/modules/settlement/` — LOCK_PENDING_APPROVAL state + dual-control approvals |
| Agent must have Owner | §14 | `prisma/schema.prisma` — `Agent.ownerNodeId` is required field |
| Revenue before incentive | §19 | `lib/modules/ledger/` — CASH ledger tracks real revenue, INCENTIVE ledger is separate |

## Scoring Formulas

### PoB Score (White Paper §11)

```
v3: PoB Score = Validity × TaskImportance × OutcomeImpact × ScarcityFactor
v1: score = baseValue × qualityMult × timeMult (legacy, preserved)
```

Implementation: `lib/modules/pob/attribution.ts` — `calculateV3PoBScore()` + `deriveV3Dimensions()`

### Node Reputation Score (White Paper §18)

```
v3: Score = α×Resource + β×Execution + γ×Trust + δ×Stability + ε×Contribution
    α=0.20, β=0.25, γ=0.25, δ=0.15, ε=0.15
v1: 7-component composite with different weights (legacy, preserved)
```

Implementation: `lib/modules/reputation/calculator.ts` — `calculateV3Score()` + `deriveV3Components()`

## Node Type System (White Paper §08-09)

The white paper distinguishes two orthogonal dimensions:

1. **NodeCategory** (identity type): HUMAN | ORG | AGENT | OPERATOR
2. **NodeScope** (geographic/functional): GLOBAL | REGION | CITY | INDUSTRY | VERTICAL | FUNCTIONAL

Both are now modeled as separate fields on the `Node` model. The legacy `NodeType` enum is preserved for migration safety.

## Three-Ledger Model (White Paper §12)

| Ledger Type | Content | Settlement Role |
|-------------|---------|-----------------|
| **CASH** | Fiat, stablecoin, service fees, success commissions | Primary distribution target |
| **RIGHTS** | Node seats, governance positions, quotas, pool access | Institutional entitlements |
| **INCENTIVE** | Points, deferred rewards, future equity mapping | Long-term alignment |

Implementation: `lib/modules/ledger/service.ts` — `Ledger` model with typed entries

## Policy Engine (White Paper §13, Appendix D)

Five built-in policies from the white paper appendix:

1. `NO_SELF_VALIDATION` — executor ≠ validator
2. `HIGH_VALUE_SETTLEMENT_APPROVAL` — high amounts require 2+ approvals
3. `AGENT_TOOL_BOUNDARY` — tools must be in whitelist
4. `CONFLICT_OF_INTEREST` — reviewer cannot be deal participant
5. `REWARD_ELIGIBILITY` — only verified proofs enter reward pool

Implementation: `lib/modules/policy/engine.ts` — `BUILTIN_POLICIES` constant + `evaluatePolicy()` + `evaluateAllPolicies()`
