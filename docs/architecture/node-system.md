# Node system (WCN)

## Types (`NodeType`)

Six roles in the registry: `GLOBAL`, `REGION`, `CITY`, `INDUSTRY`, `FUNCTIONAL`, `AGENT`. They describe network position and capability, not mutually exclusive account types.

## Lifecycle (`NodeStatus`)

Includes full onboarding and operations path plus legacy `ACTIVE`. Group for UX: draft → review → contract/live → probation → suspend/offboard.

## Console surfaces

1. **Registry** — `/dashboard/nodes`: list, filters, KPIs (catalog counts from `groupBy` when available), load-more pagination.
2. **Detail** — `/dashboard/nodes/[id]`
3. **Onboarding** — `/dashboard/nodes/[id]/onboarding`
4. **Billing** — `/dashboard/nodes/[id]/billing`
5. **Review** — `/dashboard/nodes/[id]/review`

## API

- `GET /api/nodes` returns `{ nodes, meta: { nextCursor, hasMore, limit }, statusCounts? }` with `includeCounts=1` for filtered `groupBy` counts.
- Non-admins receive `redactNodeForMember` payloads (including redacted `owner.email`).

## UI shell

Align with other dashboard modules: `dashboard-page`, `container-wide`, eyebrow, `StatCard` KPI row, `ReadOnlyInlineStrip` for members, `apps-layout` for master–detail on the registry.
