import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DocMeta {
  title: string;
  description?: string;
  chapter: number;
  section?: number;
  order: number;
}

export interface DocEntry {
  slug: string[];          // e.g. ["project-intro", "what-is-wcn"]
  href: string;            // e.g. "/wiki/project-intro/what-is-wcn"
  meta: DocMeta;
  content: string;         // raw MDX body (no frontmatter)
  chapterSlug: string;     // e.g. "project-intro"
  chapterTitle: string;    // e.g. "项目介绍"
  chapterIcon?: string;
  filePath: string;        // relative from content/docs
}

export interface ChapterEntry {
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  docs: DocEntry[];
}

interface ChapterMeta {
  title: string;
  description?: string;
  icon?: string;
  slug?: string;
}

export interface SearchIndexEntry {
  title: string;
  description?: string;
  href: string;
  chapter: string;
  body: string;
}

interface DocsCache {
  docs: DocEntry[];
  chapters: ChapterEntry[];
  docsBySlug: Map<string, DocEntry>;
  docIndexByHref: Map<string, number>;
  searchIndex: SearchIndexEntry[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CONTENT_ROOT = path.join(process.cwd(), "content", "wiki");

function readJsonSafe<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function extractHeadings(mdx: string): { id: string; text: string; level: number }[] {
  const out: { id: string; text: string; level: number }[] = [];
  for (const line of mdx.split("\n")) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (!m) continue;
    const text = m[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    out.push({ id, text, level: m[1].length });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Core API                                                           */
/* ------------------------------------------------------------------ */

let _cache: DocsCache | null = null;

function toSearchIndex(doc: DocEntry): SearchIndexEntry {
  return {
    title: doc.meta.title,
    description: doc.meta.description,
    href: doc.href,
    chapter: doc.chapterTitle,
    body: doc.content
      .replace(/<[^>]+>/g, "")
      .replace(/import\s.*?from\s.*?\n/g, "")
      .replace(/\{\/\*.*?\*\/\}/g, "")
      .slice(0, 2000),
  };
}

function loadAll(): DocsCache {
  if (_cache) return _cache;

  if (!fs.existsSync(CONTENT_ROOT)) {
    _cache = {
      docs: [],
      chapters: [],
      docsBySlug: new Map(),
      docIndexByHref: new Map(),
      searchIndex: [],
    };
    return _cache;
  }

  const chapterDirs = fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  const chapters: ChapterEntry[] = [];
  const allDocs: DocEntry[] = [];

  for (const dir of chapterDirs) {
    const dirPath = path.join(CONTENT_ROOT, dir.name);
    const metaPath = path.join(dirPath, "_meta.json");
    const chapterMeta = readJsonSafe<ChapterMeta>(metaPath);

    const orderMatch = dir.name.match(/^(\d+)/);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 99;
    const chapterSlug = chapterMeta?.slug ?? dir.name.replace(/^\d+-/, "");
    const chapterTitle = chapterMeta?.title ?? dir.name;
    const chapterIcon = chapterMeta?.icon;

    const mdxFiles = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".mdx"))
      .sort((a, b) => a.localeCompare(b, "en"));

    const docs: DocEntry[] = [];

    for (const file of mdxFiles) {
      const raw = fs.readFileSync(path.join(dirPath, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Partial<DocMeta>;

      const fileSlug = file === "index.mdx" ? "" : file.replace(/\.mdx$/, "");
      const slug = fileSlug ? [chapterSlug, fileSlug] : [chapterSlug];
      const href = "/wiki/" + slug.join("/");

      const entry: DocEntry = {
        slug,
        href,
        meta: {
          title: fm.title ?? file.replace(/\.mdx$/, ""),
          description: fm.description,
          chapter: fm.chapter ?? order,
          section: fm.section,
          order: fm.order ?? 0,
        },
        content,
        chapterSlug,
        chapterTitle,
        chapterIcon,
        filePath: path.join(dir.name, file),
      };
      docs.push(entry);
    }

    docs.sort((a, b) => a.meta.order - b.meta.order);

    chapters.push({
      slug: chapterSlug,
      title: chapterTitle,
      description: chapterMeta?.description,
      icon: chapterIcon,
      order,
      docs,
    });

    allDocs.push(...docs);
  }

  chapters.sort((a, b) => a.order - b.order);
  const docsBySlug = new Map<string, DocEntry>();
  const docIndexByHref = new Map<string, number>();

  for (const [index, doc] of allDocs.entries()) {
    docsBySlug.set(doc.slug.join("/"), doc);
    docIndexByHref.set(doc.href, index);
  }

  _cache = {
    docs: allDocs,
    chapters,
    docsBySlug,
    docIndexByHref,
    searchIndex: allDocs.map(toSearchIndex),
  };
  return _cache;
}

export function getAllDocs(): DocEntry[] {
  return loadAll().docs;
}

export function getChapters(): ChapterEntry[] {
  return loadAll().chapters;
}

export function getDocBySlug(slugParts: string[]): DocEntry | undefined {
  return loadAll().docsBySlug.get(slugParts.join("/"));
}

export function getAdjacentDocs(doc: DocEntry): { prev: DocEntry | null; next: DocEntry | null } {
  const { docs, docIndexByHref } = loadAll();
  const idx = docIndexByHref.get(doc.href);
  if (idx === undefined) return { prev: null, next: null };
  return {
    prev: idx > 0 ? docs[idx - 1] : null,
    next: idx < docs.length - 1 ? docs[idx + 1] : null,
  };
}

export function getDocHeadings(content: string) {
  return extractHeadings(content);
}

export function buildSearchIndex(): SearchIndexEntry[] {
  return loadAll().searchIndex;
}
