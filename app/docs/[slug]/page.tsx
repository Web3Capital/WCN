import Link from "next/link";
import { docs, getDoc } from "@/lib/docs";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const doc = getDoc(params.slug);

  if (!doc) notFound();

  return (
    <main className="section">
      <div className="container docs-layout">
        <aside className="sidebar">
          <p className="muted" style={{ marginBottom: 14 }}>WCN Wiki</p>
          {docs.map((item) => (
            <Link
              key={item.slug}
              href={`/docs/${item.slug}`}
              className={item.slug === params.slug ? "active" : ""}
            >
              {item.title}
            </Link>
          ))}
        </aside>

        <article className="card docs-article">
          <span className="eyebrow">Documentation</span>
          <h1>{doc.title}</h1>
          <p>{doc.description}</p>
          {doc.content.trim().split("\n\n").map((block, index) => {
            if (block.startsWith("## ")) {
              return <h2 key={index}>{block.replace("## ", "")}</h2>;
            }
            if (block.startsWith("- ")) {
              const items = block.split("\n").map((line) => line.replace(/^-\s*/, ""));
              return (
                <ul key={index}>
                  {items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              );
            }
            return <p key={index}>{block}</p>;
          })}
        </article>
      </div>
    </main>
  );
}
