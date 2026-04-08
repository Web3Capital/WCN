import { redirect } from "next/navigation";

export default function LegacyDocPage({ params }: { params: { slug: string } }) {
  // Keep old links working, but move content system to the new, chapter-based docs.
  redirect(`/docs/chapter-01/${params.slug}`);
}
