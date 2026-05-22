# `@/lib/core/api/route` — typed API route builder

Single entry point for every `app/api/**/route.ts` handler. See [ADR-0005](../../../docs/architecture/adr/0005-api-platform-layer.md) for full design rationale.

## Why use it

The builder makes four things **non-bypassable** (TypeScript will not compile if omitted):

1. **Input validation** — `input: ZodSchema` is a required field
2. **Rate-limit profile** — `rateLimit: 'public' | 'auth' | 'write' | 'expensive' | 'internal'` is required
3. **Auth gate** — choose `route.public | session | permission | service`
4. **Permission + scope** — when using `route.permission`, both `permission` and (if needed) `scope` are typed

It also auto-applies cross-cutting concerns:
- request-id propagation (for log correlation)
- safe error sanitization (no stack traces in production)
- uniform `{ ok, data?, error? }` response shape
- output schema validation when provided (output contract for `/api/v1/*`)

## Quick examples

### Public read

```ts
import { route } from "@/lib/core/api/route";
import { z } from "zod";

export const GET = route.public({
  input: z.object({}),
  rateLimit: "public",
  handler: async () => ({ ok: true, version: "1.0.0" }),
});
```

### Authenticated write

```ts
export const POST = route.session({
  input: z.object({ note: z.string() }),
  rateLimit: "write",
  handler: async ({ input, session }) => {
    const note = await prisma.note.create({ data: { content: input.note, userId: session.user.id } });
    return { id: note.id };
  },
});
```

### Permission + row-level scope

```ts
import { ownsNode } from "@/lib/auth/resource-scope";
import { isAdminRole } from "@/lib/auth/admin-role";

export const PATCH = route.permission({
  input: updateNodeSchema,
  rateLimit: "write",
  permission: { action: "update", resource: "node" },
  scope: async ({ session, params }) =>
    isAdminRole(session.user.role) || (await ownsNode(prisma, session.user.id, params.id)),
  handler: async ({ input, params }) => {
    const node = await prisma.node.update({ where: { id: params.id }, data: input });
    return node;
  },
});
```

### Service-to-service (cron, internal job)

```ts
export const POST = route.service({
  input: z.object({ cycle: z.string() }),
  rateLimit: "internal",
  handler: async ({ input }) => {
    await runIngestion(input.cycle);
    return { ok: true };
  },
});
```

## Rate-limit profiles

| Profile | Limit | Use case |
|---|---|---|
| `public` | 60/min | unauthenticated reads, `/api/health`, public APIs |
| `auth` | 5–10/min | login, signup, 2FA, SIWE |
| `write` | 30–60/min | dashboard mutations |
| `expensive` | 5–10/min | AI calls, settlement, ingestion run |
| `internal` | (none) | service-to-service callers |

## Error handling

Inside a handler you can:

```ts
import { HttpError } from "@/lib/core/api/route";

handler: async ({ input }) => {
  if (input.amount > 1_000_000) throw new HttpError(422, "AMOUNT_TOO_LARGE", "Amount exceeds policy limit");
  // ...
}
```

The builder maps:
- `HttpError` → its declared status + code
- `ZodError` (e.g. internal validation) → 400 with field issues
- anything else → 500 with sanitized message in production

## Output schemas (recommended for `/api/v1/*`)

```ts
const NodeOut = z.object({ id: z.string(), name: z.string() });

export const GET = route.public({
  input: z.object({ id: z.string() }),
  output: NodeOut,
  rateLimit: "public",
  handler: async ({ input }) => {
    const node = await prisma.node.findUniqueOrThrow({ where: { id: input.id } });
    return { id: node.id, name: node.name };  // shape-checked at runtime
  },
});
```

If the handler returns data that doesn't match `output`, the builder returns 500 instead of leaking the bad shape — protects against accidental field exposure.

## Migration cookbook (legacy → builder)

Before:

```ts
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createApplicationSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return apiUnauthorized();

  // ... business ...
  return apiCreated({ id });
}
```

After:

```ts
export const POST = route.permission({
  input: createApplicationSchema,
  rateLimit: "write",
  permission: { action: "create", resource: "node" },
  successStatus: 201,
  handler: async ({ input }) => {
    // ... business ...
    return { id };
  },
});
```

Every legacy concern (parse, auth check, error shape) is removed. The handler returns plain data; the builder shapes the response.

## What this is NOT

- Not a framework. It's ~300 LOC of glue over existing primitives in `@/lib/core/*`, `@/lib/auth/*`, and `@/lib/rate-limit`.
- Not a replacement for `requirePermission` — the builder calls it.
- Not a transport change. Stays plain Next.js App Router REST.
- Not opinionated about Prisma usage inside the handler. Use `getPrisma()` as before.

## Tracking and enforcement

- Migration progress: `npm run check:metrics` reports `rawApiHandlers` and `routesWithoutZod` / `routesWithoutRateLimit`.
- Once **Q2 Week 4** lands, an ESLint rule will block any new hand-written `export async function POST(...)` in `app/api/**`.
- See `docs/delivery/q2-systematic-fix-roadmap.md` for the full migration schedule.
