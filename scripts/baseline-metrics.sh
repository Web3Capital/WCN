#!/usr/bin/env bash
# Baseline / weekly metrics snapshot.
#
# Captures the dimensions Q1 cares about so we can prove (or disprove)
# improvement week over week. Pure shell — no build step required.
#
# Usage:   bash scripts/baseline-metrics.sh [label]
# Output:  metrics/<date>-<label>.{json,md}

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

DATE="$(date -u +%Y-%m-%d)"
LABEL="${1:-baseline}"
STAMP="${DATE}-${LABEL}"
OUT_JSON="metrics/${STAMP}.json"
OUT_MD="metrics/${STAMP}.md"

# ── helpers ────────────────────────────────────────────────────────────
count() { local n; n="$(eval "$1" 2>/dev/null | wc -l | tr -d ' ')"; echo "${n:-0}"; }

# ── code shape ─────────────────────────────────────────────────────────
DASHBOARD_TS=$(count "find 'app/[locale]/dashboard' -type f \( -name '*.ts' -o -name '*.tsx' \)")
PAGE_TSX=$(count "find 'app/[locale]/dashboard' -name page.tsx")
UI_TSX=$(count "find 'app/[locale]/dashboard' -name ui.tsx")
API_ROUTES=$(count "find app/api -name route.ts")
USE_CLIENT=$(count "grep -rl '\"use client\"' app components 2>/dev/null")
USE_SERVER=$(count "grep -rl '\"use server\"' app lib 2>/dev/null")
LIB_MODULES=$(count "find lib/modules -maxdepth 1 -mindepth 1 -type d 2>/dev/null")

# ── prisma surface ─────────────────────────────────────────────────────
PRISMA_LINES=$(wc -l < prisma/schema.prisma | tr -d ' ')
PRISMA_MODELS=$(count "grep -cE '^model ' prisma/schema.prisma | head -1; grep -E '^model ' prisma/schema.prisma")
PRISMA_ENUMS=$(count "grep -E '^enum ' prisma/schema.prisma")
PRISMA_INDEXES=$(count "grep -E '@@index|@index' prisma/schema.prisma")

# ── security surface ───────────────────────────────────────────────────
REQUIRE_ADMIN=$(count "grep -rn 'requireAdmin' app lib 2>/dev/null")
REQUIRE_PERMISSION=$(count "grep -rn 'requirePermission' app lib 2>/dev/null")
ZOD_ROUTES=$(count "grep -rl 'z.object' app/api 2>/dev/null")
RATELIMIT_REFS=$(count "grep -rln 'rateLimit\|Ratelimit' app middleware.ts 2>/dev/null")

# ── perf signals ───────────────────────────────────────────────────────
PRISMA_INCLUDE_DASH=$(count "grep -rn 'include:' 'app/[locale]/dashboard' 2>/dev/null")
PRISMA_SELECT_DASH=$(count "grep -rn 'select:' 'app/[locale]/dashboard' 2>/dev/null")
JSON_PARSE_STRINGIFY=$(count "grep -rln 'JSON.parse(JSON.stringify' app 2>/dev/null")
FORCE_DYNAMIC=$(count "grep -rln \"dynamic = 'force-dynamic'\\|dynamic = \\\"force-dynamic\\\"\" app 2>/dev/null")
UNSTABLE_CACHE=$(count "grep -rln 'unstable_cache\\|revalidateTag\\|revalidatePath' app lib 2>/dev/null")

# ── ai surface ─────────────────────────────────────────────────────────
GENERATE_TEXT=$(count "grep -rln 'generateText\\|generateObject' lib app 2>/dev/null")
STREAM_TEXT=$(count "grep -rln 'streamText\\|streamObject\\|toDataStreamResponse' lib app 2>/dev/null")

# ── tests ──────────────────────────────────────────────────────────────
UNIT_TESTS=$(count "find . -name '*.test.ts' -not -path './node_modules/*'")
E2E_TESTS=$(count "find e2e -name '*.spec.ts' 2>/dev/null")

# ── tech debt markers ──────────────────────────────────────────────────
TODO_FIXME=$(count "grep -rnE 'TODO|FIXME|XXX' app lib 2>/dev/null")
ANY_TYPE=$(count "grep -rnE ': any\\b|as any\\b' app lib 2>/dev/null")

# ── largest files (top 5) ──────────────────────────────────────────────
LARGEST_TS=$(find app lib -name '*.ts' -o -name '*.tsx' 2>/dev/null \
  | xargs wc -l 2>/dev/null \
  | sort -rn \
  | head -6 \
  | tail -5 \
  | awk '{printf "  - %s: %s lines\n", $2, $1}')

# ── dashboard list page payloads (Prisma include count per file) ───────
LIST_PAGE_INCLUDES=$(for f in 'app/[locale]/dashboard/'{nodes,projects,capital,deals,tasks,pob}'/page.tsx'; do
  if [ -f "$f" ]; then
    n=$(grep -c 'include:' "$f" 2>/dev/null || echo 0)
    echo "  - $f: $n include() calls"
  fi
done)

# ── git ────────────────────────────────────────────────────────────────
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)
GIT_AHEAD=$(git rev-list --count "${GIT_BRANCH}" ^main 2>/dev/null || echo 0)

# ── write outputs ──────────────────────────────────────────────────────
cat > "$OUT_JSON" <<EOF
{
  "date": "${DATE}",
  "label": "${LABEL}",
  "git": { "branch": "${GIT_BRANCH}", "sha": "${GIT_SHA}", "ahead_of_main": ${GIT_AHEAD} },
  "code": {
    "dashboard_ts_files": ${DASHBOARD_TS},
    "dashboard_page_tsx": ${PAGE_TSX},
    "dashboard_ui_tsx": ${UI_TSX},
    "api_route_files": ${API_ROUTES},
    "use_client_files": ${USE_CLIENT},
    "use_server_files": ${USE_SERVER},
    "lib_module_dirs": ${LIB_MODULES}
  },
  "prisma": {
    "schema_lines": ${PRISMA_LINES},
    "models": ${PRISMA_MODELS},
    "enums": ${PRISMA_ENUMS},
    "indexes_declared": ${PRISMA_INDEXES}
  },
  "security": {
    "requireAdmin_calls": ${REQUIRE_ADMIN},
    "requirePermission_calls": ${REQUIRE_PERMISSION},
    "routes_with_zod": ${ZOD_ROUTES},
    "ratelimit_refs": ${RATELIMIT_REFS}
  },
  "perf": {
    "prisma_include_in_dashboard": ${PRISMA_INCLUDE_DASH},
    "prisma_select_in_dashboard": ${PRISMA_SELECT_DASH},
    "json_parse_stringify_files": ${JSON_PARSE_STRINGIFY},
    "force_dynamic_files": ${FORCE_DYNAMIC},
    "unstable_cache_or_revalidate_files": ${UNSTABLE_CACHE}
  },
  "ai": {
    "generateText_or_Object_files": ${GENERATE_TEXT},
    "streamText_or_Object_files": ${STREAM_TEXT}
  },
  "tests": {
    "unit_test_files": ${UNIT_TESTS},
    "e2e_spec_files": ${E2E_TESTS}
  },
  "debt": {
    "todo_fixme_xxx": ${TODO_FIXME},
    "any_type_occurrences": ${ANY_TYPE}
  }
}
EOF

cat > "$OUT_MD" <<EOF
# Baseline metrics — ${STAMP}

Branch \`${GIT_BRANCH}\` @ \`${GIT_SHA}\` (${GIT_AHEAD} commits ahead of main)

## Code shape
- Dashboard ts/tsx files: **${DASHBOARD_TS}**
- Dashboard page.tsx: ${PAGE_TSX}
- Dashboard ui.tsx: ${UI_TSX}
- API route handlers: **${API_ROUTES}**
- \`"use client"\` files: ${USE_CLIENT}
- \`"use server"\` files: **${USE_SERVER}** (target Q2: ≥ 20)
- lib/modules dirs: ${LIB_MODULES}

## Prisma surface
- schema.prisma lines: **${PRISMA_LINES}**
- models: ${PRISMA_MODELS}
- enums: ${PRISMA_ENUMS}
- indexes declared: ${PRISMA_INDEXES}

## Security
- \`requireAdmin\` call sites: **${REQUIRE_ADMIN}** (target Q1 end: < 5)
- \`requirePermission\` call sites: ${REQUIRE_PERMISSION} (target Q1 end: ≥ 25)
- Routes with Zod parse: ${ZOD_ROUTES}
- Files referencing rate limiting: ${RATELIMIT_REFS}

## Perf signals
- Prisma \`include:\` in dashboard pages: ${PRISMA_INCLUDE_DASH}
- Prisma \`select:\` in dashboard pages: ${PRISMA_SELECT_DASH} (target: select > include)
- \`JSON.parse(JSON.stringify(...))\` files: ${JSON_PARSE_STRINGIFY} (target: 0)
- \`force-dynamic\` files: ${FORCE_DYNAMIC}
- Files using \`unstable_cache\` / \`revalidateTag\` / \`revalidatePath\`: ${UNSTABLE_CACHE} (target Q2: ≥ 10)

### Per-list-page Prisma include counts
${LIST_PAGE_INCLUDES}

## AI surface
- Files using \`generateText\` / \`generateObject\`: ${GENERATE_TEXT}
- Files using streaming variants: ${STREAM_TEXT} (target: > 0 on agent paths)

## Tests
- Unit test files: ${UNIT_TESTS}
- E2E spec files: ${E2E_TESTS} (target Q1 end: ≥ 7 — one per P0 module)

## Tech debt markers
- TODO / FIXME / XXX: ${TODO_FIXME}
- \`: any\` / \`as any\` occurrences: ${ANY_TYPE}

## Largest files
${LARGEST_TS}

---
Generated by \`scripts/baseline-metrics.sh\`. Re-run weekly. Compare two snapshots:

\`\`\`
diff metrics/2026-04-30-baseline.md metrics/2026-05-07-week1.md
\`\`\`
EOF

echo "Wrote ${OUT_JSON} and ${OUT_MD}"
