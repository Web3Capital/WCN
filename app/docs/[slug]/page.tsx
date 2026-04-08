import { redirect } from "next/navigation";

export default function LegacyDocPage({ params }: { params: { slug: string } }) {
  // Keep old links working: send to docs index (which redirects to first chapter doc).
  const map: Record<string, string> = {
    introduction: "/docs",
    problem: "/docs",
    solution: "/docs",
    mechanism: "/docs",
    pob: "/docs",
    settlement: "/docs"
  };

  redirect(map[params.slug] ?? "/docs");
}
