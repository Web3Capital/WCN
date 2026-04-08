import { redirect } from "next/navigation";
import { getWcnChapters } from "@/lib/wcn-docs";
import { cookies } from "next/headers";

export default function DocsIndexPage() {
  const lang = cookies().get("wcn_lang")?.value === "zh" ? "zh" : "en";
  const chapters = getWcnChapters(lang);
  const first = chapters[0]?.docs[0];
  redirect(first ? `/docs/${first.slugParts.join("/")}` : "/");
}

