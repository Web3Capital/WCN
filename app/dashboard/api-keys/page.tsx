import type { Metadata } from "next";
import { ApiKeysUI } from "./ui";

export const metadata: Metadata = { title: "API Keys – WCN" };

export default function ApiKeysPage() {
  return <ApiKeysUI />;
}
