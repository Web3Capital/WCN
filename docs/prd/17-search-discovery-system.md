# PRD-17: Search & Discovery System

> Status: Draft | Priority: P1 — Important | Owner: Product Lead
> Dependencies: PRD-02 (Node), PRD-04 (Project), PRD-06 (Deal)
> Affects: PRD-05 (Capital Matching), user experience across all modules

---

## 1. Overview

The Search & Discovery System provides unified search across all WCN entities — nodes, projects, deals, tasks, and documents — and intelligent discovery features that surface relevant opportunities proactively. It replaces the "who do I know" limitation of relationship-based networks with systematic, permission-aware discovery.

**Core Principle**: The best match is the one you didn't know existed. Search handles explicit queries; discovery handles implicit ones — surfacing relevant nodes, projects, and opportunities before users ask.

---

## 2. Core User Stories

### Search
- US-17.1: As a user, I can search across all entities from a global search bar.
- US-17.2: As a system, I return results scoped by the user's permissions (can't find nodes/projects they don't have access to).
- US-17.3: As a user, I can filter search results by entity type (node, project, deal, document).
- US-17.4: As a system, I support full-text search across names, descriptions, and document contents.
- US-17.5: As a user, I get instant search suggestions as I type (typeahead).

### Discovery
- US-17.6: As a capital node, I see a "Recommended Projects" feed on my dashboard based on my profile.
- US-17.7: As a project node, I see "Suggested Capital" and "Suggested Services" based on my needs.
- US-17.8: As a system, I send weekly "New Opportunities" digests with relevant new entries.
- US-17.9: As a user, I can save searches and get notified when new results match.

---

## 3. Data Model

```
SearchIndex (virtual — backed by search engine)
├── entityType: enum (NODE, PROJECT, DEAL, TASK, DOCUMENT)
├── entityId: string
├── title: string
├── description: string
├── content: string (full text for documents)
├── tags: string[]
├── sector: string?
├── stage: string?
├── region: string?
├── status: string?
├── createdAt: datetime
├── updatedAt: datetime
├── accessLevel: json (which roles/nodes can see this)

SavedSearch
├── id: string
├── userId: string (FK → User)
├── query: string
├── filters: json
├── notifyOnNew: boolean
├── lastNotifiedAt: datetime?
└── createdAt: datetime

DiscoveryFeed
├── id: string
├── userId: string (FK → User)
├── nodeId: string (FK → Node)
├── items: DiscoveryItem[]
├── generatedAt: datetime

DiscoveryItem
├── id: string
├── feedId: string (FK → DiscoveryFeed)
├── entityType: enum (NODE, PROJECT)
├── entityId: string
├── relevanceScore: float (0-1)
├── reason: string ("Matches your sector preference in DeFi")
├── isViewed: boolean
├── viewedAt: datetime?
```

---

## 4. Feature Breakdown

### P0
- [ ] Global search bar (top of every page)
- [ ] Full-text search across nodes and projects
- [ ] Permission-aware search results
- [ ] Search result filtering by entity type
- [ ] Typeahead suggestions

### P1
- [ ] Discovery feed on dashboard
- [ ] Recommendation engine (based on node profile + history)
- [ ] Document search (search within uploaded materials)
- [ ] Saved searches with notifications
- [ ] Advanced filters (sector, stage, region, deal value, reputation)

### P2
- [ ] Semantic search (natural language queries: "AI projects looking for $500K seed round in APAC")
- [ ] Similar node/project finder ("find more like this")
- [ ] Search analytics (what are people searching for)
- [ ] Voice search (mobile)

---

## 5. Technical Architecture

```
User query → API Gateway → Search Service
  → Full-text index (PostgreSQL full-text search / MeiliSearch / Algolia)
  → Permission filter (post-query, filter results user can't access)
  → Rank and return

Discovery pipeline (async):
  Node profile updated → Re-calculate discovery feed
  New project/node added → Push to relevant discovery feeds
  Weekly: Generate "New Opportunities" digest
```

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Search usage rate (% of active users who search weekly) | > 40% |
| Search-to-action conversion (search → view profile/project) | > 50% |
| Discovery feed engagement rate | > 30% click-through |
| Average search latency | < 200ms |
| Zero-result search rate | < 10% |
