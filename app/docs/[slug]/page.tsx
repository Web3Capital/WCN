import { redirect } from "next/navigation";

export default function LegacyDocPage({ params }: { params: { slug: string } }) {
  // Keep old links working after migrating to chapter-based docs.
  // Map the starter slugs to the closest chapter landing pages.
  const map: Record<string, string> = {
    introduction: "/docs/chapter-01/01-项目介绍-首页",
    problem: "/docs/chapter-02/02-行业问题-首页",
    solution: "/docs/chapter-03/3-1-WCN-的整体解法",
    mechanism: "/docs/chapter-04/04-WCN如何运作-首页",
    pob: "/docs/chapter-08/08-PoB-首页",
    settlement: "/docs/chapter-12/12-路线图-首页"
  };

  redirect(encodeURI(map[params.slug] ?? "/docs/chapter-01/01-项目介绍-首页"));
}
