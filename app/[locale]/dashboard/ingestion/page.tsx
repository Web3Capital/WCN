import type { Metadata } from "next";
import { IngestionUI } from "./ui";

export const metadata: Metadata = { title: "Data Ingestion – WCN" };

export default function IngestionPage() {
  return <IngestionUI />;
}
