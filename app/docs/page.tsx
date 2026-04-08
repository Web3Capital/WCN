import { redirect } from "next/navigation";
import { getWcnChapters } from "@/lib/wcn-docs";

export default function DocsIndexPage() {
  const chapters = getWcnChapters();
  const first = chapters[0]?.docs[0];
  redirect(first ? `/docs/${first.slugParts.join("/")}` : "/");
}

