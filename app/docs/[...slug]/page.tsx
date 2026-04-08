import Link from "next/link";
import { notFound } from "next/navigation";
import { getWcnChapters, getWcnDocBySlugParts, getAllWcnDocs } from "@/lib/wcn-docs";

export function generateStaticParams() {
  return getAllWcnDocs().map((doc) => ({ slug: doc.slugParts }));
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
  const doc = getWcnDocBySlugParts(params.slug);
  if (!doc) notFound();

  const chapters = getWcnChapters();
  const current = doc.slugParts.join("/");

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
        </article>
      </div>
    </main>
  );
}

