#!/usr/bin/env tsx
/**
 * Generate content/wiki/en/ from content/wiki/zh/.
 *
 * Strategy:
 *   - Translate frontmatter title/description.
 *   - Translate _meta.json title/description.
 *   - Translate markdown text lines and JSX attribute string values that
 *     contain Chinese characters. Code fences, imports, and non-CJK
 *     attribute names (href, icon, id, src, className, type, cols, slug)
 *     are preserved as-is.
 *   - Slugify the English title to derive the English filename.
 *   - Second pass: rewrite internal /wiki/<chapter>/<old-zh-slug> links to
 *     point at the new English slugs.
 *
 * Engine: Google Translate's "dict-chrome-ex" endpoint (free, no key needed).
 * Cache: scripts/.translate-wiki-cache.json (per-string).
 *
 * Usage:
 *   npx tsx scripts/translate-wiki.ts            # full run
 *   npx tsx scripts/translate-wiki.ts --chapter 01-project-intro
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SRC = path.join(process.cwd(), "content", "wiki", "zh");
const DST = path.join(process.cwd(), "content", "wiki", "en");
const CACHE_PATH = path.join(process.cwd(), "scripts", ".translate-wiki-cache.json");

const ZH = /[一-鿿]/;
const NON_TRANSLATABLE_ATTRS = new Set([
  "href", "icon", "id", "src", "className", "class", "type", "cols",
  "rows", "slug", "name", "key", "ref", "alt", // alt could be Chinese — but let's keep simple for now; actually translate alt
]);
// Actually: alt is descriptive text, should translate. Remove from non-translatable.
NON_TRANSLATABLE_ATTRS.delete("alt");

/* ------------------------- args ------------------------- */
const args = process.argv.slice(2);
const chapterArgIdx = args.indexOf("--chapter");
const onlyChapter = chapterArgIdx >= 0 ? args[chapterArgIdx + 1] : null;
const rewriteOnly = args.includes("--rewrite-only");

/* ------------------------- cache ------------------------- */
const cache: Record<string, string> = fs.existsSync(CACHE_PATH)
  ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"))
  : {};

let cacheDirty = false;
function flushCache() {
  if (!cacheDirty) return;
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
  cacheDirty = false;
}

/* ------------------------- translate ------------------------- */
async function gtranslate(text: string): Promise<string> {
  const url =
    "https://translate.googleapis.com/translate_a/t?" +
    new URLSearchParams({ client: "dict-chrome-ex", sl: "zh-CN", tl: "en" }).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `q=${encodeURIComponent(text)}`,
  });
  if (!res.ok) throw new Error(`Google Translate ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Possible shapes:
  //   "translated"
  //   ["translated"]
  //   [["seg1", "src1"], ["seg2", "src2"], …]    ← multi-segment
  //   ["translated", "src"]                      ← single with source
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    if (data.length === 0) return text;
    if (data.every((d) => typeof d === "string")) return data[0];
    if (data.every((d) => Array.isArray(d))) {
      // multi-segment: join all first elements
      return (data as string[][]).map((arr) => arr[0] ?? "").join("");
    }
  }
  return text;
}

async function tr(text: string): Promise<string> {
  if (!ZH.test(text)) return text;
  const trimmed = text.trim();
  if (cache[trimmed]) {
    // Preserve original surrounding whitespace.
    const lead = text.match(/^\s*/)?.[0] ?? "";
    const tail = text.match(/\s*$/)?.[0] ?? "";
    return lead + cache[trimmed] + tail;
  }
  try {
    const out = (await gtranslate(trimmed)).trim();
    cache[trimmed] = out;
    cacheDirty = true;
    const lead = text.match(/^\s*/)?.[0] ?? "";
    const tail = text.match(/\s*$/)?.[0] ?? "";
    return lead + out + tail;
  } catch (err) {
    console.warn(`  ! translate failed for "${trimmed.slice(0, 40)}…" — ${(err as Error).message}`);
    return text;
  }
}

/* ------------------------- jsx-safe quote escaping ------------------------- */
/**
 * Convert ASCII straight quotes inside a JSX attribute value to typographic
 * quotes so they don't collide with the surrounding attribute delimiter.
 * Alternates “ then ” so any pair the translator inserted reads naturally.
 */
function escapeInnerQuotes(value: string, delimiter: string): string {
  if (!value.includes(delimiter)) return value;
  if (delimiter === '"') {
    let open = true;
    return value.replace(/"/g, () => (open = !open) ? "”" : "“");
  }
  // single-quote delimiter: alternate ‘ then ’
  let open = true;
  return value.replace(/'/g, () => (open = !open) ? "’" : "‘");
}

/* ------------------------- slugify ------------------------- */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s.-]/g, " ")
    .replace(/[\s_.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Take "1.1 What is WCN" → "1-1-what-is-wcn"
 * Preserve the numeric chapter-section prefix from the original Chinese filename
 * to maintain ordering and meta `order` mapping.
 */
function buildEnFilename(origZhFilename: string, enTitle: string): string {
  if (origZhFilename === "index.mdx") return "index.mdx";
  // Original like "1-1-wcn-是什么.mdx" → keep "1-1-" prefix, slug the rest from enTitle
  const prefixMatch = origZhFilename.match(/^(\d+(?:-\d+)*)-/);
  const prefix = prefixMatch ? prefixMatch[1] + "-" : "";
  const titleSlug = slugify(enTitle).replace(/^\d+(-\d+)*-/, "");
  return `${prefix}${titleSlug || "untitled"}.mdx`;
}

/* ------------------------- line-level MDX translation ------------------------- */
/**
 * Translate a single MDX line.
 * - Code fence boundaries are managed by caller.
 * - Heading lines (`#`, `##`, …): translate text after `#`.
 * - Lines containing JSX attribute string values: translate values with CJK
 *   (except when attr is in NON_TRANSLATABLE_ATTRS).
 * - Plain text lines: translate the whole line if it contains CJK.
 */
async function translateLine(line: string): Promise<string> {
  // Heading
  const heading = line.match(/^(\s*)(#{1,6})\s+(.+)$/);
  if (heading) {
    const text = await tr(heading[3]);
    return `${heading[1]}${heading[2]} ${text}`;
  }

  // JSX: lines that contain attribute="…" or attribute='…' patterns
  // We extract attr value pairs and translate each value (where attr is translatable and value has CJK).
  if (/<\w+/.test(line) || /^\s*\w+=("[^"]*"|'[^']*')/.test(line)) {
    let result = line;
    // Match attr="value" or attr='value'
    const attrRe = /(\b[\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    const pieces: { match: string; attr: string; quote: string; val: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(line)) !== null) {
      const attr = m[1];
      const dqVal = m[3];
      const sqVal = m[4];
      const quote = dqVal !== undefined ? '"' : "'";
      const val = dqVal !== undefined ? dqVal : sqVal!;
      pieces.push({ match: m[0], attr, quote, val });
    }
    for (const p of pieces) {
      if (NON_TRANSLATABLE_ATTRS.has(p.attr)) continue;
      if (!ZH.test(p.val)) continue;
      const translated = await tr(p.val);
      // Translator turns CJK guillemets into ASCII straight quotes, which
      // collide with the JSX attribute delimiter. Convert any inner straight
      // quote of the same kind to typographic so MDX still parses.
      const safe = escapeInnerQuotes(translated, p.quote);
      const replacement = `${p.attr}=${p.quote}${safe}${p.quote}`;
      result = result.replace(p.match, replacement);
    }
    // If, after attribute substitution, there is still un-translated CJK text
    // outside of any tag in this line (e.g. `<Hero>foo中文bar</Hero>` on one line),
    // try a per-segment translation of text between tags.
    if (ZH.test(result.replace(/<[^>]+>/g, ""))) {
      // Strip tags, translate the remaining CJK runs.
      result = await translateInlineText(result);
    }
    return result;
  }

  // Plain markdown / inline JSX line
  if (ZH.test(line)) {
    return await translateInlineText(line);
  }
  return line;
}

/**
 * Translate CJK runs while preserving HTML/JSX tags inline.
 * We split by JSX tags and translate only the gap segments.
 */
async function translateInlineText(line: string): Promise<string> {
  // Capture <…> spans (incl. self-closing) and leave them untouched.
  const parts = line.split(/(<\/?[A-Za-z][^>]*>)/g);
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    if (i % 2 === 1) continue; // tag span
    if (!ZH.test(seg)) continue;
    parts[i] = await tr(seg);
  }
  return parts.join("");
}

/* ------------------------- file-level translation ------------------------- */
async function translateBody(body: string): Promise<string> {
  const lines = body.split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^\s*import\s/.test(line)) continue;
    if (!ZH.test(line)) continue;
    lines[i] = await translateLine(line);
  }
  return lines.join("\n");
}

async function translateMdxFile(srcPath: string): Promise<{ enFilename: string; content: string; enTitle: string }> {
  const raw = fs.readFileSync(srcPath, "utf8");
  const parsed = matter(raw);
  const fm: Record<string, unknown> = { ...parsed.data };

  // Translate string-typed frontmatter values that contain CJK.
  for (const k of Object.keys(fm)) {
    const v = fm[k];
    if (typeof v === "string" && ZH.test(v)) {
      fm[k] = (await tr(v));
    }
  }
  const enTitle = (typeof fm.title === "string" ? fm.title : "") || path.basename(srcPath, ".mdx");

  const body = await translateBody(parsed.content);

  const out = matter.stringify(body, fm);
  const enFilename = buildEnFilename(path.basename(srcPath), enTitle);
  return { enFilename, content: out, enTitle };
}

async function translateMetaJson(srcPath: string, dstPath: string): Promise<void> {
  const data = JSON.parse(fs.readFileSync(srcPath, "utf8")) as Record<string, unknown>;
  for (const k of ["title", "description"]) {
    const v = data[k];
    if (typeof v === "string" && ZH.test(v)) {
      data[k] = await tr(v);
    }
  }
  fs.writeFileSync(dstPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/* ------------------------- driver ------------------------- */
type ChapterPlan = {
  zhDir: string;
  enDir: string;
  files: { zhName: string; enName: string }[];
};

async function processChapter(chapterDir: string): Promise<ChapterPlan> {
  const zhDir = path.join(SRC, chapterDir);
  const enDir = path.join(DST, chapterDir);
  fs.mkdirSync(enDir, { recursive: true });

  console.log(`\n📚 ${chapterDir}`);

  // _meta.json
  const metaSrc = path.join(zhDir, "_meta.json");
  const metaDst = path.join(enDir, "_meta.json");
  if (fs.existsSync(metaSrc)) {
    await translateMetaJson(metaSrc, metaDst);
    console.log(`   ✓ _meta.json`);
    flushCache();
  }

  // *.mdx
  const mdxFiles = fs.readdirSync(zhDir).filter((f) => f.endsWith(".mdx")).sort();
  const fileMap: { zhName: string; enName: string }[] = [];
  for (const file of mdxFiles) {
    const src = path.join(zhDir, file);
    const { enFilename, content } = await translateMdxFile(src);
    const dst = path.join(enDir, enFilename);
    fs.writeFileSync(dst, content, "utf8");
    fileMap.push({ zhName: file, enName: enFilename });
    console.log(`   ✓ ${file}  →  ${enFilename}`);
    flushCache();
  }

  return { zhDir, enDir, files: fileMap };
}

/**
 * Second pass: rewrite internal hrefs in the en/ tree.
 *   /wiki/<chapter>/<old-zh-slug>  →  /wiki/<chapter>/<new-en-slug>
 * Chapter slugs are unchanged (defined in _meta.json `slug`).
 */
function rewriteInternalLinks(plans: ChapterPlan[]) {
  // Build chapter-slug → { zhFileSlug: enFileSlug } map.
  const slugMap: Record<string, Record<string, string>> = {};
  for (const plan of plans) {
    const metaPath = path.join(plan.enDir, "_meta.json");
    let chapterSlug = path.basename(plan.enDir).replace(/^\d+-/, "");
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      if (typeof meta.slug === "string") chapterSlug = meta.slug;
    }
    if (!slugMap[chapterSlug]) slugMap[chapterSlug] = {};
    for (const f of plan.files) {
      if (f.zhName === "index.mdx") continue;
      const zhSlug = f.zhName.replace(/\.mdx$/, "");
      const enSlug = f.enName.replace(/\.mdx$/, "");
      slugMap[chapterSlug][zhSlug] = enSlug;
    }
  }

  console.log(`\n🔗 Rewriting internal links across en/ tree…`);
  let touched = 0;
  for (const plan of plans) {
    const files = fs.readdirSync(plan.enDir).filter((f) => f.endsWith(".mdx"));
    for (const file of files) {
      const p = path.join(plan.enDir, file);
      const raw = fs.readFileSync(p, "utf8");
      let out = raw;
      // /wiki/<chapter>/<zh-slug>
      out = out.replace(/(\/wiki\/)([a-z0-9-]+)\/([^\s"')]+)/g, (match, prefix, chapter, slug) => {
        const decoded = decodeURIComponent(slug);
        const map = slugMap[chapter];
        if (!map) return match;
        const mapped = map[decoded];
        return mapped ? `${prefix}${chapter}/${mapped}` : match;
      });
      if (out !== raw) {
        fs.writeFileSync(p, out, "utf8");
        touched++;
      }
    }
  }
  console.log(`   ✓ rewrote links in ${touched} file(s)`);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source not found: ${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(DST, { recursive: true });

  const chapterDirs = fs
    .readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .filter((n) => (onlyChapter ? n === onlyChapter : true))
    .sort();

  if (chapterDirs.length === 0) {
    console.error(onlyChapter ? `Chapter not found: ${onlyChapter}` : "No chapters found");
    process.exit(1);
  }

  if (rewriteOnly) {
    // Build plans by introspecting existing en/ directory and matching to zh/ by chapter+order.
    console.log(`Rebuilding href map from existing en/ tree…`);
    const plans: ChapterPlan[] = [];
    for (const ch of chapterDirs) {
      const zhDir = path.join(SRC, ch);
      const enDir = path.join(DST, ch);
      if (!fs.existsSync(enDir)) continue;
      const zhFiles = fs.readdirSync(zhDir).filter((f) => f.endsWith(".mdx")).sort();
      const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith(".mdx")).sort();
      // Match by numeric prefix (e.g. "1-1-" → "1-1-")
      const prefixOf = (n: string) => (n.match(/^(\d+(?:-\d+)*)-/) || ["", ""])[1];
      const files: { zhName: string; enName: string }[] = [];
      for (const zh of zhFiles) {
        if (zh === "index.mdx") { files.push({ zhName: zh, enName: "index.mdx" }); continue; }
        const p = prefixOf(zh);
        const en = enFiles.find((f) => prefixOf(f) === p && f !== "index.mdx");
        if (en) files.push({ zhName: zh, enName: en });
      }
      plans.push({ zhDir, enDir, files });
    }
    rewriteInternalLinks(plans);
    console.log(`\n✅ Done.`);
    return;
  }

  console.log(`Translating ${chapterDirs.length} chapter(s) → ${path.relative(process.cwd(), DST)}/`);

  const plans: ChapterPlan[] = [];
  for (const ch of chapterDirs) {
    plans.push(await processChapter(ch));
  }
  flushCache();
  rewriteInternalLinks(plans);
  console.log(`\n✅ Done. Cache: ${path.relative(process.cwd(), CACHE_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  flushCache();
  process.exit(1);
});
