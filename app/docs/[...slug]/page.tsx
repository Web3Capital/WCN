import Link from "next/link";
import { notFound } from "next/navigation";
import { getWcnChapters, getWcnDocBySlugParts, getAllWcnDocs } from "@/lib/wcn-docs";
import { cookies } from "next/headers";

export function generateStaticParams() {
  const zh = getAllWcnDocs("zh").map((doc) => ({ slug: doc.slugParts }));
  const en = getAllWcnDocs("en").map((doc) => ({ slug: doc.slugParts }));
  return [...zh, ...en];
}

function renderContent(content: string) {
  return content.split("\n\n").map((block, index) => {
    if (block.startsWith("## ")) return <h2 key={index}>{block.replace(/^##\s+/, "")}</h2>;
    if (block.startsWith("### ")) return <h3 key={index}>{block.replace(/^###\s+/, "")}</h3>;
    if (block.startsWith("- ")) {
      const items = block.split("\n").map((line) => line.replace(/^-\s*/, "")).filter(Boolean);
      return (
        <ul key={index}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      );
    }
    return <p key={index}>{block}</p>;
  });
}

export default function DocPage({ params }: { params: { slug: string[] } }) {
  const lang = cookies().get("wcn_lang")?.value === "zh" ? "zh" : "en";
  const doc = getWcnDocBySlugParts(lang, params.slug);
  if (!doc) notFound();

  const chapters = getWcnChapters(lang);
  const allDocs = getAllWcnDocs(lang);
  const current = doc.slugParts.join("/");
  const currentIndex = allDocs.findIndex((d) => d.slugParts.join("/") === current);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  return (
    <main className="section">
      <div className="container docs-layout">
        <aside className="sidebar">
          <p className="muted" style={{ marginBottom: 14 }}>WCN Docs</p>
          {chapters.map((chapter) => (
            <div key={chapter.id} style={{ marginBottom: 14 }}>
              <div className="pill" style={{ marginBottom: 10 }}>{chapter.title}</div>
              {chapter.docs.map((item) => {
                const href = `/docs/${item.slugParts.join("/")}`;
                const active = item.slugParts.join("/") === current;
                return (
                  <Link key={href} href={href} className={active ? "active" : ""}>
                    {item.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        <article className="card docs-article">
          <span className="eyebrow">{doc.chapter.title}</span>
          <h1>{doc.title}</h1>
          {doc.description ? <p>{doc.description}</p> : null}
          {renderContent(doc.content)}

          <div className="docs-nav-footer">
            {prevDoc ? (
              <Link href={`/docs/${prevDoc.slugParts.join("/")}`} className="docs-nav-btn">
                <span className="docs-nav-btn-label">← Previous</span>
                <span>{prevDoc.title}</span>
              </Link>
            ) : <span />}
            {nextDoc ? (
              <Link href={`/docs/${nextDoc.slugParts.join("/")}`} className="docs-nav-btn" style={{ textAlign: "right" }}>
                <span className="docs-nav-btn-label">Next →</span>
                <span>{nextDoc.title}</span>
              </Link>
            ) : <span />}
          </div>
        </article>
      </div>
    </main>
  );
}
