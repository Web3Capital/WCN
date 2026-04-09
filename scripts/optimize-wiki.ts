/**
 * Wiki content optimizer — fixes common issues across all MDX files.
 *
 * Usage:  npx tsx scripts/optimize-wiki.ts
 *
 * Fixes:
 *  1. Add missing `description` from Hero lead text
 *  2. Remove trailing "## 下一页" / "WCN · Chapter" navigation cruft
 *  3. Remove duplicate H2 that matches the Hero H1
 *  4. Standardize Hero badges to Chinese format (Chapter XX → 第X章)
 *  5. Ensure consistent frontmatter structure
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const WIKI_DIR = path.join(process.cwd(), "content", "wiki");

const CHAPTER_TITLES: Record<number, string> = {
  1: "项目介绍",
  2: "行业问题",
  3: "WCN 的解法",
  4: "WCN 如何运作",
  5: "网络架构",
  6: "节点系统",
  7: "AI Agent 系统",
  8: "Proof of Business",
  9: "商业模式",
  10: "节点加入",
  11: "治理与合规",
  12: "路线图",
  13: "为什么是 WCN",
  14: "加入 WCN",
  15: "资源中心",
};

function processFile(filePath: string): boolean {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data: fm, content } = matter(raw);
  let body = content;
  let changed = false;

  // 1. Extract description from Hero lead if missing
  if (!fm.description) {
    const heroMatch = body.match(/<Hero[^>]*lead="([^"]+)"/);
    if (heroMatch) {
      const lead = heroMatch[1].replace(/\s+/g, " ").trim();
      fm.description = lead.length > 160 ? lead.slice(0, 157) + "…" : lead;
      changed = true;
    }
  }

  // 2. Remove trailing navigation cruft
  const cruftPatterns = [
    /\n+## 下一页[\s\S]*$/,
    /\n+继续阅读：[^\n]+\n*/g,
    /\n+WCN · Chapter \d+ HTML Visual Edition\s*$/,
    /\n+WCN · Chapter \d+\s*$/,
  ];
  for (const pat of cruftPatterns) {
    const before = body;
    body = body.replace(pat, "\n");
    if (before !== body) changed = true;
  }

  // 3. Remove duplicate H2 that matches the Hero H1
  const heroH1Match = body.match(/<Hero[^>]*>\n#\s+(.+)\n<\/Hero>/);
  if (heroH1Match) {
    const h1Text = heroH1Match[1].trim();
    const duplicateH2 = new RegExp(`\n## ${escapeRegex(h1Text)}\n`);
    const before = body;
    body = body.replace(duplicateH2, "\n");
    if (before !== body) changed = true;
  }

  // 4. Standardize Hero badges from English to Chinese
  const badgeRe = /(<Hero[^>]*badge=")Chapter\s+(\d+)\s*·\s*/g;
  const before4 = body;
  body = body.replace(badgeRe, (_match, prefix, num) => {
    const chTitle = CHAPTER_TITLES[parseInt(num)] || `第${num}章`;
    return `${prefix}第${num}章 · ${chTitle} · `;
  });
  if (before4 !== body) changed = true;

  // 5. Clean up trailing whitespace
  const trimmed = body.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  if (trimmed !== body) {
    body = trimmed;
    changed = true;
  }

  if (changed) {
    const output = matter.stringify(body, fm);
    fs.writeFileSync(filePath, output, "utf-8");
    console.log(`  ✓ ${path.relative(WIKI_DIR, filePath)}`);
  }

  return changed;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function walkDir(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walkDir(full));
    else if (entry.name.endsWith(".mdx")) result.push(full);
  }
  return result;
}

const files = walkDir(WIKI_DIR);
let count = 0;
console.log(`\nOptimizing ${files.length} wiki files...\n`);
for (const f of files) {
  if (processFile(f)) count++;
}
console.log(`\n✅ Updated ${count} / ${files.length} files.\n`);
