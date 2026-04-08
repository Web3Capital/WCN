import fs from "node:fs";
import path from "node:path";

export type WcnDoc = {
  slugParts: string[];
  id: string;
  title: string;
  description?: string;
  content: string;
  chapter: {
    id: string;
    title: string;
    order: number;
  };
  sourcePath: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content", "wcn");

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeHtmlEntities(input: string) {
  return input
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&#8217;", "’")
    .replaceAll("&#8220;", "“")
    .replaceAll("&#8221;", "”");
}

function stripTags(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/section>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractMeta(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  return { title, description };
}

function extractBody(html: string) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  return body
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
}

function htmlToDocContent(html: string) {
  // Keep headings and list items as simple markdown-ish blocks.
  const body = extractBody(html);

  const withHeadings = body
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1\n");

  const text = stripTags(withHeadings);

  // Normalize bullet sections (ensure blank line before list).
  return text
    .replace(/\n(- )/g, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chapterInfoFromPath(relDir: string) {
  // Examples:
  // - Chapter_01
  // - WCN_Chapter8_HTML
  const m1 = relDir.match(/^Chapter_(\d+)/i);
  const m2 = relDir.match(/Chapter(\d+)_HTML/i);
  const numStr = (m1?.[1] ?? m2?.[1]) ?? "0";
  const order = Number.parseInt(numStr, 10) || 0;
  const id = `chapter-${String(order).padStart(2, "0")}`;
  const title = `Chapter ${String(order).padStart(2, "0")}`;
  return { id, title, order };
}

function slugifySegment(segment: string) {
  return segment
    .replace(/\.html$/i, "")
    .replace(/\s+/g, "-")
    .replace(/\./g, "-")
    .replace(/_+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function listHtmlFilesRecursive(dirAbs: string): string[] {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      out.push(...listHtmlFilesRecursive(abs));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) out.push(abs);
  }
  return out;
}

export function getAllWcnDocs(): WcnDoc[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];

  const files = listHtmlFilesRecursive(CONTENT_ROOT);
  const docs: WcnDoc[] = files.map((abs) => {
    const rel = path.relative(CONTENT_ROOT, abs);
    const parts = rel.split(path.sep);
    const dir = parts.length > 1 ? parts[0] : "";
    const file = parts[parts.length - 1];

    const raw = fs.readFileSync(abs, "utf8");
    const { title, description } = extractMeta(raw);

    const chapter = chapterInfoFromPath(dir);
    const relNoExt = rel.replace(/\.html$/i, "");
    const id = toBase64Url(relNoExt);
    const slugParts = [chapter.id, id];
    const content = htmlToDocContent(raw);

    return {
      slugParts,
      id,
      title: title ?? slugifySegment(file),
      description,
      content,
      chapter,
      sourcePath: rel
    };
  });

  docs.sort((a, b) => {
    if (a.chapter.order !== b.chapter.order) return a.chapter.order - b.chapter.order;
    return a.slugParts.join("/").localeCompare(b.slugParts.join("/"), "zh-CN");
  });

  return docs;
}

export function getWcnDocBySlugParts(slugParts: string[]): WcnDoc | undefined {
  const wanted = slugParts.join("/");
  return getAllWcnDocs().find((d) => d.slugParts.join("/") === wanted);
}

export function getWcnChapters() {
  const docs = getAllWcnDocs();
  const map = new Map<string, { id: string; title: string; order: number; docs: WcnDoc[] }>();
  for (const doc of docs) {
    const existing = map.get(doc.chapter.id);
    if (existing) existing.docs.push(doc);
    else map.set(doc.chapter.id, { ...doc.chapter, docs: [doc] });
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}

