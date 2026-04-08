import { redirect } from "next/navigation";

export default function DocsIndexPage() {
  redirect(encodeURI("/docs/chapter-01/01-项目介绍-首页"));
}

