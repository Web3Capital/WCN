# ADR-0005 — API Platform Layer (typed route builder + ratchets)

- **Status**: Accepted (Q2 kickoff, parallel to ADR-0004)
- **Date**: 2026-05-09
- **Decider**: Tech Lead
- **Depends on**: [ADR-0001](./0001-strangler-fig-evolution.md), [ADR-0002](./0002-rbac-migration-week2.md)
- **Parallel with**: [ADR-0004](./0004-pob-event-sourcing-pilot.md) (PoB ES pilot — does not block, does not depend on)

## Context

Q1 close-out baseline (`metrics/2026-04-30-q1-final.md`) revealed the **structural** debt left over after RBAC stabilization:

| Surface | Coverage | Comment |
|---|---:|---|
| `requirePermission` | 181 / 181 mutations | ✅ Q1 done |
| `requireAdmin` | 2 / 35 | ✅ Q1 done (only definition + tests) |
| Routes with **Zod parse** | **15 / 128** (~12%) | 🔴 P0 — biggest open security gap |
| Routes with **rate limit** | **4 / 128** | 🔴 P0 — no per-route enforcement |
| Routes with **explicit output schema** | 0 | 🟠 leak surface |
| Routes that write **AuditLog** uniformly | inconsistent | 🟠 forensic gap |

The pattern in 113 of 128 routes is the same as `app/api/applications/route.ts`: `parseBody(schema, body)` is called manually if the author remembered, but there is **no compiler-level enforcement**. The same is true for rate limiting — the helpers in `lib/rate-limit.ts` exist but only 4 files import them.

A "sprint to fix 113 routes" was considered and rejected. Without a structural change, the same drift returns within a quarter as new routes are added.

## Decision

Introduce a single typed **API Builder** (`lib/core/api/route.ts`) that all `app/api/**/route.ts` handlers must use. The builder makes the following **non-bypassable** (TypeScript will fail to compile if omitted):

1. `input: ZodSchema` — input validation
2. `rateLimit: 'public' | 'auth' | 'write' | 'expensive' | 'internal'` — rate-limit profile
3. `auth: 'public' | 'session' | 'permission' | 'service'` — auth gate
4. (when `auth: 'permission'`) `permission: { action, resource }` + optional `scope: ScopeFn` — RBAC + row-level check

Cross-cutting concerns automatically applied to every handler:
- request-id header propagation (`lib/core/request-id.ts`)
- safe error sanitization (`lib/core/safe-error.ts`)
- uniform `apiOk / apiError` response shape (`lib/core/api-response.ts`)
- structured logging (pino)
- optional `audit: AuditTag` writes a row to `AuditLog`

A complementary **metrics ratchet** (`scripts/metrics-gate.ts`) snapshots current counts and **fails CI on regression**. Each PR can only push the numbers down, never up.

## Non-goals (explicit)

- ❌ Not migrating all 128 routes in this ADR. Migration is a 4-week parallel program (`docs/delivery/q2-systematic-fix-roadmap.md`).
- ❌ Not introducing a new framework. The builder is ~200 LOC of glue over existing primitives.
- ❌ Not coupled to ADR-0004 PoB event sourcing. PoB routes will migrate via the same builder when their phase lands; the builder grants no special PoB capability.
- ❌ Not replacing `requirePermission` / `requireRole`. The builder calls them.
- ❌ Not introducing tRPC, GraphQL, or any new transport. Stays plain REST + Next.js App Router.

## Architecture

### Public API

```ts
// lib/core/api/route.ts
import { z } from "zod";

export const route = {
  /** Public endpoints (marketing pages, /api/health, opengraph). */
  public: <I, O>(cfg: PublicCfg<I, O>) => Handler,

  /** Any authenticated session, no specific permission. */
  session: <I, O>(cfg: SessionCfg<I, O>) => Handler,

  /** Permission + optional row-level scope. Replaces `requirePermission` + `ownsXxx` boilerplate. */
  permission: <I, O>(cfg: PermissionCfg<I, O>) => Handler,

  /** Service-to-service (cron, internal jobs). Service token required. */
  service: <I, O>(cfg: ServiceCfg<I, O>) => Handler,
};

interface CommonCfg<I, O> {
  input: z.ZodSchema<I>;        // ⚡ required by type
  output?: z.ZodSchema<O>;       // optional, encouraged for /api/v1/*
  rateLimit: RateLimitProfile;  // ⚡ required by type
  audit?: AuditTag;             // emits AuditLog row on success
  handler: (ctx: Ctx<I>) => Promise<O>;
}

type RateLimitProfile = 'public' | 'auth' | 'write' | 'expensive' | 'internal';
```

### Rate-limit profiles (single source of truth)

| Profile | Limit | Use cases |
|---|---|---|
| `public` | 60/min | unauthenticated reads, `/api/health` |
| `auth` | 5/min | `/api/auth/*`, `/api/account/2fa/*`, `/login`, `/signup` |
| `write` | 30/min | dashboard mutations |
| `expensive` | 5/min | AI calls, settlement generate, ingestion run |
| `internal` | (none) | service tokens, cron — internal callers |

Implemented over the existing `@upstash/ratelimit` setup (`lib/rate-limit.ts`). No new dependency.

### Compiler-enforced enrolment

ESLint rule `no-restricted-syntax` blocks the legacy pattern in `app/api/**`:

```js
{
  selector: "ExportNamedDeclaration > FunctionDeclaration[id.name=/^(GET|POST|PATCH|DELETE|PUT)$/]",
  message: "Use route.{public|session|permission|service} from @/lib/core/api/route. See ADR-0005."
}
```

Existing 128 routes get a one-time `// eslint-disable-next-line` with a TODO comment referencing the migration tracker. The metrics ratchet counts these and **fails CI if the count grows**.

### Metrics ratchet

`scripts/metrics-gate.ts`:

```ts
const RATCHETS = {
  rawApiHandlers:        { ceiling: <baseline>, msg: "...migrate to route.* per ADR-0005" },
  routesWithoutZod:      { ceiling: <baseline> },
  routesWithoutRateLim:  { ceiling: <baseline> },
  anyTypeOccurrences:    { ceiling: <baseline> },
  jsonParseStringify:    { ceiling: <baseline> },
  i18nMissingKeysVsEn:   { ceiling: <baseline> },
};
```

Ceiling values are read from `metrics/ratchet.json`. CI fails if any current value exceeds its ceiling. PRs that lower a value automatically commit a new lower ceiling (PR diff includes both the source change AND the ratchet decrease — visible in review).

## Migration program

See [`docs/delivery/q2-systematic-fix-roadmap.md`](../../delivery/q2-systematic-fix-roadmap.md).

Summary:
- **Week 1** (this ADR + scaffolding): builder + ratchet + 1 example migration. CI gate added but in `warn` mode (does not fail) for 1 week to let in-flight PRs resolve.
- **Week 2**: 35 write routes migrated, ratchet escalates to `error`.
- **Week 3**: 35 read routes + `/api/v1/*` (with output schemas).
- **Week 4**: remaining ~30 routes; ESLint rule from `warn` → `error`.

Each migration PR ≤ 7 routes, includes e2e specs (authed + unauthed + over-limit).

## Done criteria (Q2 acceptance)

| # | Criterion | Verification |
|---|---|---|
| 1 | All 128 routes use `route.*` builder | `metrics-gate`: `rawApiHandlers == 0` |
| 2 | Zod input on every route | `routesWithoutZod == 0` |
| 3 | Rate-limit profile on every route | `routesWithoutRateLim == 0` |
| 4 | ESLint rule at `error`, blocking new violations | `eslint.config.mjs` |
| 5 | `/api/v1/*` routes have output schemas | manual audit |
| 6 | Metrics-gate CI step blocks regressions | passing CI history |
| 7 | Builder unit tests cover all 4 profiles + scope | `lib/core/api/__tests__/route.test.ts` |

## Risks & mitigation

| Risk | Mitigation |
|---|---|
| Builder design has a flaw discovered after 30 routes migrated | Week 1 prototype migrates 3 of the most complex routes (pob create, settlement cycle, agent run) for stress test before mass migration |
| ESLint rule too strict, blocks legitimate edge cases | Rule starts at `warn`, escalates to `error` only after Week 2 migration cohort lands cleanly |
| Conflict with ADR-0004 PoB event sourcing | PoB routes excluded from ratchet for 30 days during Phase A; PoB routes adopt builder when their phase migrates |
| Extra layer adds cognitive load for new contributors | One-page cheatsheet `lib/core/api/README.md` + 5 example routes; README links from CONTRIBUTING |
| Rate-limit profile mis-classification (e.g. write classified as public) | PR template asks "what profile and why?"; reviewer checklist; metrics dashboard surfaces profile distribution |
| Existing `lib/rate-limit.ts` lacks the 5 profiles | Add 2 new limiter instances (`write`, `expensive`); existing `api/auth/admin/sms` map to existing limiters |

## Decision required from operator

None to start scaffolding. Decisions deferred to Week 2:
1. Whether to feature-flag the migration (off-by-default rollout) or hard-cut. Recommend hard-cut — change is additive.
2. Whether to publish `/api/v1/*` schemas as OpenAPI (extra 1-day work).

## Tracking

PR series tagged `[adr-0005]`. Branch convention: `claude/api-platform-*`. Each migration PR prefixes title with the cohort week (e.g. `[w2-write] migrate /api/applications + /api/nodes mutations to route.permission`).
