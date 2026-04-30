# E2E specs — RBAC coverage

Playwright API tests covering the authorization gates added in Week 2 of the
Q1 stabilization (PR #4). Closes done-criterion #5 of [ADR-0003](../docs/architecture/adr/0003-week2-kickoff.md).

## What's here

9 spec files:

| Spec | Domain | What it covers |
|---|---|---|
| `api-smoke.spec.ts` | public API | Health endpoint + basic 401 (pre-existing) |
| `rbac-pob.spec.ts` | `/api/pob` | NODE_OWNER positive + IDOR + unauthenticated |
| `rbac-tasks.spec.ts` | `/api/tasks` | NODE_OWNER positive + IDOR + unauthenticated |
| `rbac-projects.spec.ts` | `/api/projects` | NODE_OWNER positive + IDOR + unauthenticated |
| `rbac-settlement.spec.ts` | `/api/settlement/cycles` | FINANCE_ADMIN positive (capability unlocked W2) + NODE_OWNER negative |
| `rbac-reviews.spec.ts` | `/api/reviews` | REVIEWER positive (capability unlocked W2) + USER negative + unauth |
| `rbac-policies.spec.ts` | `/api/policies` | FOUNDER positive + NODE_OWNER negative + USER read-widening |
| `rbac-nodes.spec.ts` | `/api/nodes/[id]` PATCH | NODE_OWNER profile-fields positive + 5-field privileged-field gate (status/ownerUserId/level/type/riskLevel) + IDOR + admin override + unauth |
| `rbac-agents.spec.ts` | `/api/agents/[id]` PATCH | Disjunctive gate: NODE_OWNER own-agent update positive + IDOR + RISK_DESK freeze positive (any agent) + RISK_DESK update negative + unauth |

## Fixtures

| File | Purpose |
|---|---|
| `fixtures/auth.ts` | `sessionCookieHeader({userId, role})` — mints a NextAuth-compatible JWT cookie using the same `next-auth/jwt` `encode()` the runtime uses |
| `fixtures/seed.ts` | Idempotent upsert of 5 test users + 2 test nodes (FOUNDER, NODE_OWNER A/B, REVIEWER, FINANCE_ADMIN) |
| `fixtures/global-setup.ts` | Playwright `globalSetup` hook that runs `seedTestFixtures()` once before any spec |

`testIgnore: ["**/fixtures/**"]` keeps Playwright from treating fixture files as
specs.

## Running

```bash
npm run test:e2e       # one-shot
npm run test:e2e:ui    # interactive UI mode
```

`playwright.config.ts` will:
1. Run `globalSetup` to seed test users + nodes
2. Build + start the app (`npm run build && npx next start`)
3. Run all `*.spec.ts` against `http://127.0.0.1:3000`

## Pre-flight requirements

For the specs to actually pass against a real DB:

1. **Database schema must be migrated.** The dev DB used during Week 1–2
   development was observed with drift (`Node.category` column missing on
   server-side query). Run `npx prisma migrate deploy` first.
2. **`NEXTAUTH_SECRET` must be set** so `signSession()` can encode the JWT
   that matches the runtime's expected secret. Already in `.env.local`.
3. **`POSTGRES_URL` / `DATABASE_URL` must be set.** Used by `seed.ts` via
   `getPrisma()`. Already in `.env.local`.

## What this verifies — and what it doesn't

**Verified by design** (each spec asserts):
- Authorization gate pass-through: the right role + ownership reaches handler
- IDOR rejection: wrong-owner attempts return 401/403 (NOT 200/404)
- Unauthenticated rejection: 401 across the board

**NOT verified by these specs**:
- **Functional correctness of handler logic** (what gets created, audit
  rows, event-bus emissions). Unit tests in `lib/modules/**/__tests__`
  cover those individually.
- **Concurrent IDOR via timing** (TOCTOU between gate and DB write). Would
  need adversarial harness; out of scope.

## Status awareness

Specs in this commit have been **written and tsc-verified** but were
**not executed in the same session** because:
- A `next build` cycle would have to run to bring up the test server
- The local dev DB still carries pre-existing schema drift unrelated to
  Week 2 work, which would cause unrelated failures masking real ones

Specs will run cleanly on:
- A freshly-migrated dev DB
- Preview deployments
- CI (once added to GitHub Actions)

Recommend: include `npm run test:e2e` in the CI pipeline so each subsequent
PR validates against the matrix.

## Adding more specs

The pattern is:

```ts
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

const cookie = await sessionCookieHeader({ userId: TEST_IDS.<role>, role: "<ROLE>" });
const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
const res = await ctx.<get|post|patch|delete>("/api/...", { data: ... });
expect(res.status()).toBe(...);
await ctx.dispose();
```

Three checks per route minimum: positive (correct role + ownership) /
negative (correct role + wrong ownership = IDOR) / unauthenticated.
