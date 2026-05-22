#!/usr/bin/env tsx
/**
 * Metrics ratchet — codebase-shape ceilings that may only go down.
 *
 * Strategy mirrors `check-i18n.ts`: snapshot current debt as a ceiling,
 * fail CI if any tracked metric grows. PRs that improve a metric also
 * commit the new (lower) ceiling, making improvement visible in review.
 *
 * Usage:
 *   npx tsx scripts/metrics-gate.ts            # verify (CI)
 *   npx tsx scripts/metrics-gate.ts --update   # rewrite ceilings
 *   npx tsx scripts/metrics-gate.ts --report   # print snapshot, exit 0
 *
 * Source of truth: `metrics/ratchet.json`.
 *
 * See:
 *   - docs/architecture/adr/0005-api-platform-layer.md
 *   - docs/delivery/q2-systematic-fix-roadmap.md
 *   - metrics/2026-04-30-q1-final.md  (initial baseline)
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const RATCHET_PATH = join(REPO_ROOT, "metrics", "ratchet.json");

// ─── Metric definitions ─────────────────────────────────────────
//
// Each metric is a function that returns a non-negative integer.
// Lower is better. Ceilings live in metrics/ratchet.json.

interface Metric {
  key: string;
  describe: string;
  measure: () => number;
  /** Optional remediation hint shown when the gate trips. */
  remediation?: string;
}

function countLines(cmd: string): number {
  try {
    const out = execSync(cmd, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.split("\n").filter((l) => l.length > 0).length;
  } catch {
    return 0;
  }
}

/** Walk a directory and yield every .ts/.tsx file path (relative to repo root). */
function* walkSource(dir: string): Generator<string> {
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(cur);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(cur, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (entry === "node_modules" || entry === ".next" || entry === ".git" || entry === ".claude" || entry === "coverage" || entry === "test-results" || entry === "playwright-report") {
          continue;
        }
        stack.push(full);
      } else if (st.isFile() && (entry.endsWith(".ts") || entry.endsWith(".tsx"))) {
        yield relative(REPO_ROOT, full);
      }
    }
  }
}

function* walkApiRoutes(): Generator<string> {
  const apiDir = join(REPO_ROOT, "app", "api");
  if (!existsSync(apiDir)) return;
  for (const f of walkSource(apiDir)) {
    if (f.endsWith("/route.ts") || f.endsWith("\\route.ts")) yield f;
  }
}

function readFile(rel: string): string {
  try {
    return readFileSync(join(REPO_ROOT, rel), "utf8");
  } catch {
    return "";
  }
}

const METRICS: Metric[] = [
  {
    key: "rawApiHandlers",
    describe: "API route files NOT yet using @/lib/core/api/route builder",
    remediation: "Migrate via route.{public|session|permission|service}; see ADR-0005.",
    measure: () => {
      let n = 0;
      for (const f of walkApiRoutes()) {
        const src = readFile(f);
        if (!src.includes('from "@/lib/core/api/route"')) n++;
      }
      return n;
    },
  },
  {
    key: "routesWithoutZod",
    describe: "API routes without any Zod schema reference",
    remediation: "Add Zod schema; prefer route.* builder which makes input required.",
    measure: () => {
      let n = 0;
      for (const f of walkApiRoutes()) {
        const src = readFile(f);
        if (!/z\.object|z\.string|z\.number|ZodSchema|parseBody\(/.test(src)) n++;
      }
      return n;
    },
  },
  {
    key: "routesWithoutRateLimit",
    describe: "API routes without rate-limit reference",
    remediation: "Use route.* builder (rateLimit profile required) or call rateLimit*() helpers.",
    measure: () => {
      let n = 0;
      for (const f of walkApiRoutes()) {
        const src = readFile(f);
        if (!/rateLimit|Ratelimit/.test(src)) n++;
      }
      return n;
    },
  },
  {
    key: "anyTypeOccurrences",
    describe: "Occurrences of `: any` or `as any` in app/ + lib/ (excluding generated)",
    remediation: "Replace with proper types or `unknown`; ratchet down weekly.",
    measure: () =>
      countLines(`grep -rnE ': any\\b|as any\\b' app lib --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'lib/generated' || true`),
  },
  {
    key: "jsonParseStringifyFiles",
    describe: "Files using JSON.parse(JSON.stringify(...)) anti-pattern",
    remediation: "Use superjson or explicit DTO mapping.",
    measure: () =>
      countLines(`grep -rln 'JSON.parse(JSON.stringify' app lib --include='*.ts' --include='*.tsx' 2>/dev/null || true`),
  },
  {
    key: "forceDynamicFiles",
    describe: "Files with `dynamic = 'force-dynamic'`",
    remediation: "Replace with unstable_cache + revalidateTag where applicable (Q2 Week 6).",
    measure: () =>
      countLines(`grep -rlnE "dynamic\\s*=\\s*['\\\"]force-dynamic['\\\"]" app --include='*.ts' --include='*.tsx' 2>/dev/null || true`),
  },
  {
    key: "requireAdminCallSites",
    describe: "Imports/calls of legacy requireAdmin (must stay 0)",
    remediation: "Use requirePermission(action, resource); see ADR-0002.",
    measure: () =>
      countLines(`grep -rnE 'requireAdmin\\b' app lib --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'lib/admin.ts' || true`),
  },
];

// ─── Ratchet I/O ────────────────────────────────────────────────

interface Ratchet {
  generatedAt: string;
  ceilings: Record<string, number>;
}

function loadRatchet(): Ratchet | null {
  if (!existsSync(RATCHET_PATH)) return null;
  return JSON.parse(readFileSync(RATCHET_PATH, "utf8")) as Ratchet;
}

function writeRatchet(ratchet: Ratchet): void {
  writeFileSync(RATCHET_PATH, JSON.stringify(ratchet, null, 2) + "\n");
}

function snapshot(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of METRICS) out[m.key] = m.measure();
  return out;
}

function formatTable(current: Record<string, number>, ceilings: Record<string, number> | null): string {
  const lines: string[] = [];
  lines.push("Metric                          Current  Ceiling  Δ");
  lines.push("------                          -------  -------  -");
  for (const m of METRICS) {
    const cur = current[m.key] ?? 0;
    const ceil = ceilings?.[m.key] ?? null;
    const delta = ceil === null ? "" : cur > ceil ? `+${cur - ceil} ✖` : cur < ceil ? `-${ceil - cur} ✓` : "0";
    const ceilStr = ceil === null ? "(new)" : String(ceil);
    lines.push(`${m.key.padEnd(32)}${String(cur).padStart(7)}  ${ceilStr.padStart(7)}  ${delta}`);
  }
  return lines.join("\n");
}

function main(): number {
  const args = new Set(process.argv.slice(2));
  const update = args.has("--update");
  const report = args.has("--report");

  const current = snapshot();

  if (report) {
    const r = loadRatchet();
    console.log(formatTable(current, r?.ceilings ?? null));
    return 0;
  }

  if (update) {
    const ratchet: Ratchet = { generatedAt: new Date().toISOString(), ceilings: current };
    writeRatchet(ratchet);
    console.log(`✓ wrote ${RATCHET_PATH}`);
    console.log(formatTable(current, current));
    return 0;
  }

  // Verify
  const r = loadRatchet();
  if (!r) {
    console.error(`✖ no ratchet at ${RATCHET_PATH}. Run with --update to create.`);
    return 2;
  }

  const violations: string[] = [];
  for (const m of METRICS) {
    const cur = current[m.key] ?? 0;
    const ceil = r.ceilings[m.key];
    if (ceil === undefined) {
      violations.push(`✖ metric '${m.key}' has no ceiling. Run --update.`);
      continue;
    }
    if (cur > ceil) {
      violations.push(
        `✖ ${m.key}: ${cur} > ceiling ${ceil} (regression of ${cur - ceil}).` +
          (m.remediation ? `\n   → ${m.remediation}` : ""),
      );
    }
  }

  if (violations.length > 0) {
    console.error("metrics ratchet FAILED — at least one tracked metric regressed.");
    console.error("");
    for (const v of violations) console.error(v);
    console.error("");
    console.error("If the regression is intentional, run:");
    console.error("  npx tsx scripts/metrics-gate.ts --update");
    console.error("and commit the updated metrics/ratchet.json with a justification in the PR description.");
    return 1;
  }

  console.log("✓ metrics ratchet within ceilings");
  console.log(formatTable(current, r.ceilings));
  return 0;
}

process.exit(main());
