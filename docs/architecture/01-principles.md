# 01 — Design Principles

> The architecture decisions that govern every technical choice in WCN.

---

## Axiom 0: Architecture Serves Business, Not the Reverse

WCN exists to coordinate real business between real organizations. Every architectural decision must pass the test: **"Does this make it easier for a VC to find a project, close a deal, and get settled?"** If the answer is no, the decision is wrong regardless of its technical elegance.

---

## 14 Governing Principles

### P1: Correctness Over Performance

WCN handles financial attribution and settlement. A bug that credits the wrong node or miscalculates settlement is an existential threat. Therefore:

- All state transitions go through validated state machines — no ad-hoc status updates.
- All financial calculations use `Decimal` types, never floating point.
- Settlement logic has mandatory dual-path verification (calculate twice, compare).
- PoB attribution must be deterministic: same inputs always produce same outputs.

**Trade-off accepted**: We accept 50ms slower responses to add validation layers.

### P2: Audit Everything, Delete Nothing

Every significant action produces an immutable audit record. This is non-negotiable for:
- Regulatory compliance (MiCA, SEC frameworks)
- PoB integrity (evidence chain must be unbroken)
- Dispute resolution (what actually happened)
- Debugging (reproduce any issue from the audit trail)

**Implementation**: The `@wcn/audit` module provides a one-line SDK. Every service function calls `audit()` after state changes. Audit records are append-only — no UPDATE, no DELETE, ever.

### P3: Module Ownership — "You Build It, You Own It"

Each of the 18 modules owns:
- Its **database tables** (no other module writes to them directly)
- Its **API endpoints** (no shared controllers)
- Its **business logic** (no cross-module function imports for writes)
- Its **events** (well-defined event schema)

Cross-module reads are allowed via clearly defined **read interfaces**. Cross-module writes happen ONLY through **events** or **explicit service calls through published interfaces**.

```
✅ @wcn/deals reads Node data through @wcn/nodes.getNode(id)
✅ @wcn/proof-desk listens to "deal.closed" event
❌ @wcn/deals directly updates the Node table
❌ @wcn/settlement imports internal functions from @wcn/pob
```

### P4: Events First, Direct Calls Second

When Module A needs Module B to do something after A completes an action:
1. **First choice**: A emits an event, B listens → loose coupling
2. **Second choice**: A calls B's published service interface → acceptable for synchronous needs
3. **Never**: A directly accesses B's database or internal functions

Event-driven architecture enables:
- Adding new reactions without modifying the emitter
- Replaying events for debugging or migration
- Eventually extracting modules into separate services

### P5: Progressive Decentralization in Architecture

The system architecture must support three governance phases without rewriting:

| Phase | Authority Model | Technical Implication |
|-------|-----------------|----------------------|
| **Centralized** (now) | Founding team decides | Admin role has full access; no on-chain governance |
| **Council** (2027) | Elected council votes | Proposal/Vote system activates; voting weight from PoB |
| **Decentralized** (2028+) | Community governance | Smart contract execution; on-chain PoB; token-weighted voting |

**Architectural consequence**: Every governance-sensitive action goes through an `AuthorizationGate` that can be reconfigured from "admin approval" to "council vote" to "smart contract" without changing business logic.

### P6: Explicit State Machines for All Lifecycles

Every entity with a lifecycle (Node, Deal, Task, Evidence, Settlement, Application) uses an explicit state machine. All state machines are consolidated in `lib/core/state-machine.ts` as the single source of truth. The legacy files under `lib/state-machines/` are deprecated re-export shims kept for backward compatibility.

- Valid transitions are enumerated (no arbitrary status changes)
- Side effects are triggered by transitions (not by status values)
- Invalid transitions throw errors (not silently ignored)
- Transition history is audited

```typescript
// lib/core/state-machine.ts (canonical location)
const DEAL_TRANSITIONS = {
  DRAFT:          ["ACTIVE", "CANCELLED"],
  ACTIVE:         ["DUE_DILIGENCE", "CLOSED_LOST", "CANCELLED"],
  DUE_DILIGENCE:  ["NEGOTIATION", "CLOSED_LOST", "CANCELLED"],
  NEGOTIATION:    ["CLOSING", "CLOSED_LOST", "CANCELLED"],
  CLOSING:        ["CLOSED_WON", "CLOSED_LOST", "CANCELLED"],
  CLOSED_WON:     [],  // terminal
  CLOSED_LOST:    [],  // terminal
  CANCELLED:      [],  // terminal
};
```

### P7: Permission by Default, Access by Exception

WCN is a permissioned network. The default for every resource is **deny access**. Access must be explicitly granted through:

1. **Role** (ADMIN, MEMBER, OBSERVER)
2. **Node membership** (user belongs to the node that owns the resource)
3. **Deal participation** (user is a participant in the deal)
4. **Explicit grant** (AccessGrant record for specific entity access)

**Data scoping** happens at the query level, not the UI level. Even if the UI hides a button, the API MUST enforce the same restriction.

### P8: AI Assists, Humans Decide

All Agent outputs are **suggestions until human-approved**. This is not a philosophical preference — it's a legal and operational necessity:

- Agent-generated match memos: human reviews before sending to capital
- Agent-extracted action items: human confirms before creating tasks
- Agent risk flags: human investigates before blocking
- Agent settlement calculations: human approves before distribution

**Permission levels**: READ → ANALYZE → SUGGEST → ACT. Only ACT level can change state, and only for pre-approved action categories with full audit logging.

### P9: API-First, UI-Second

Every feature is implemented as an API first, then wrapped with UI. This ensures:
- Mobile apps, CLI tools, and third-party integrations get the same capabilities
- UI bugs don't indicate API bugs (separate concerns)
- Testing is faster (API tests > E2E tests)
- Future SDK development is straightforward

**Convention**: No `page.tsx` server component should contain business logic beyond fetching and permission checking. All mutations go through API routes.

### P10: Design for 10x, Build for 1x

Current network: <100 nodes. Target: 10,000+ nodes. Architecture must support 10x growth without rewriting, but we don't over-engineer for 100x today.

**Practical meaning**:
- Use PostgreSQL (sufficient for 10K nodes, millions of records) — don't adopt microservices prematurely
- Use server-side rendering (sufficient for dashboard traffic) — don't build a SPA framework
- Use in-process event bus (implemented, sufficient for current load) — backed by Transactional Outbox for reliability; event schemas designed to move to Redis/Kafka later
- Use Prisma ORM (sufficient for current complexity) — but keep complex queries in raw SQL escape hatches

### P11: Hexagonal Inversion — Ports Over Infrastructure

Domain logic depends on pure TypeScript interfaces (ports), never on infrastructure (Prisma, Redis, S3) directly. Every module defines a `ports.ts` with data-access contracts using domain-level types — zero ORM imports.

```
lib/modules/deals/ports.ts       → DealPort interface (findMany, findById, create, update)
lib/modules/matching/ports.ts    → MatchPort interface (findForProject, findForCapital, ...)
lib/modules/settlement/ports.ts  → SettlementPort interface (getCycles, getLines, ...)
... 21 modules total
```

**Why**: Swapping from Prisma to Drizzle, adding a caching layer, or extracting a module into a microservice requires only a new adapter — zero changes to business logic. Ports also make unit testing trivial (inject mock adapters).

### P12: Extension over Modification

New business capabilities are added by **registering** into extension points, not by modifying core code. A generic `ExtensionPoint<TConfig, THandler>` pattern powers domain registries for node types, deal types, agent types, and settlement methods.

```
✅ Register a new node type: nodeTypeRegistry.register("EXCHANGE", { ... })
✅ Register a new deal type: dealTypeRegistry.register("M_AND_A", { ... })
❌ Add a new if-else branch in the deal service for each new type
❌ Modify the node creation function whenever a new node type is introduced
```

**Trade-off accepted**: Slightly more indirection for dramatic reduction in coupling and risk when the business evolves.

### P13: Fail-Closed by Default

When infrastructure is degraded or a check is ambiguous, the system denies the request rather than allowing it through. This is non-negotiable for a financial platform:

- **Rate limiter**: Redis unavailable in production → return 429 (deny), not pass-through
- **Auth wrapper**: Session invalid or account LOCKED/SUSPENDED → return 401/403 immediately
- **Error responses**: Production errors return generic messages; stack traces and internal details are never exposed (`lib/core/safe-error.ts`)

**Exception**: Development environment retains fail-open behavior for rate limiting to avoid blocking local work.

### P14: Mechanical Boundary Enforcement

Module isolation is enforced by **tooling**, not just documentation or code review:

- **ESLint** `no-restricted-imports` rules (`lib/modules/.eslintrc.json`) block direct imports of module internals (e.g., `service.ts`, `engine.ts`) from outside the module boundary
- **dependency-cruiser** (`.dependency-cruiser.cjs`) detects cross-module internal imports and circular dependencies in CI
- **Barrel exports** (`lib/modules/*/index.ts`) define the only importable surface for each module

If the tooling allows it, the architecture permits it. If the tooling blocks it, no amount of "but I need it" justifies a bypass — find the contract-compliant way.

---

## Anti-Patterns We Explicitly Reject

| Anti-Pattern | Why We Reject It | What We Do Instead |
|---|---|---|
| **Premature microservices** | Team of <10 cannot maintain 18 services | Modular monolith with extractable boundaries |
| **Generic CRUD frameworks** | Hides domain complexity, leads to anemic models | Rich domain services with explicit business rules |
| **Open API surface** | Every endpoint is an attack surface | Permission-by-default, scope everything |
| **Shared mutable state** | Cross-module coupling nightmare | Module-owned tables, event-driven sync |
| **"Smart" UI** | Business logic in React components is untestable | API-first, thin UI layer |
| **DAO-style open governance from day one** | Premature decentralization → deadlock | Progressive decentralization per P5 |
| **On-chain everything** | Expensive, slow, irreversible for iteration | Off-chain first, anchor critical proofs on-chain |
| **Convention-only boundaries** | Humans forget, code review misses | Mechanical enforcement via ESLint + dependency-cruiser (P14) |
| **Fail-open security** | One Redis outage = open door | Fail-closed by default, deny on ambiguity (P13) |

---

## Decision Records

Major architectural decisions are recorded as ADRs (Architecture Decision Records) in `docs/architecture/adr/`. Format:

```
ADR-XXX: [Title]
Status: Proposed | Accepted | Deprecated | Superseded
Context: Why was this decision needed?
Decision: What did we decide?
Consequences: What are the trade-offs?
```
