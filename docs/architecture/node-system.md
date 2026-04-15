# Node system (WCN)

> **Product baseline:** [Node Network System PRD v1.0](../prd/node-network-system-prd-v1.md)（组织定位、模块、状态机、与其他系统关系、研发 Waves）。本页偏**当前实现**与 API/UI 行为。

## Types (`NodeType`)

Six roles in the registry: `GLOBAL`, `REGION`, `CITY`, `INDUSTRY`, `FUNCTIONAL`, `AGENT`. They describe network position and capability, not mutually exclusive account types.

## Lifecycle (`NodeStatus`)

Includes full onboarding and operations path plus legacy `ACTIVE`. PRD v1.0 adds **`WATCHLIST`** (operational monitoring between Live and Suspended). `CONTRACTING` may transition to **`PROBATION`** or **`LIVE`**. Group for UX: draft → review → contract → live / probation → watchlist → suspend/offboard.

## Console surfaces

1. **Registry** — `/dashboard/nodes`: list, filters, KPIs (catalog counts from `groupBy` when available), load-more pagination.
2. **Review queue** — `/dashboard/nodes/review-queue`: nodes in `SUBMITTED`, `UNDER_REVIEW`, `NEED_MORE_INFO` (Founder / Admin / Reviewer / Risk desk). KPI **total** uses `count` (not row cap); list loads the newest **300** by `updatedAt` with a banner when `total > 300`. Client: stage chips with i18n labels, text search (name / owner / region / vertical / id), sort (updated or name), locale-formatted timestamps, link back to registry.
3. **Detail** — `/dashboard/nodes/[id]`
4. **Onboarding** — `/dashboard/nodes/[id]/onboarding`
5. **Billing** — `/dashboard/nodes/[id]/billing`
6. **Review** — `/dashboard/nodes/[id]/review`

## API

- `GET /api/nodes` returns `{ nodes, meta: { nextCursor, hasMore, limit }, statusCounts? }` with `includeCounts=1` for filtered `groupBy` counts.
- Non-admins receive `redactNodeForMember` payloads (including redacted `owner.email`).
- Non-admin **list** and **counts** are scoped to `ownerUserId = current user` (SSR, `GET /api/nodes`, and `cursor` must refer to an owned row). Detail `GET /api/nodes/[id]` still returns a redacted payload for other nodes when permitted by existing rules.
- `PATCH /api/nodes/[id]` (admin): writes `NODE_STATUS_CHANGE` when status transitions; `NODE_UPDATE` with `metadata.fields` for other patched columns (auto status side-effect timestamps are not duplicated in `NODE_UPDATE`).

## UI shell

Align with **Capital** dashboard patterns: `dashboard-page`, `container-wide`, `Network` eyebrow, `StatCard` KPI row (`grid-4 mb-16`), admin status charts, `FilterToolbar` + search + list/pipeline views, amber read-only card for members; registry uses `apps-layout` master–detail; detail uses `DetailLayout` without duplicate eyebrow (see capital detail shell).
