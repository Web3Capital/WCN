import type { ReactNode } from "react";

/** Single row in a chronological note / audit list (matches Project Activity line shape). */
export type NoteFeedItem = {
  id: string;
  body: ReactNode;
  meta: ReactNode;
};

/** @deprecated Use NoteFeedItem */
export type CapitalNoteFeedItem = NoteFeedItem;

/** Section chrome aligned with `/dashboard/projects/[id]` blocks. */
export type NoteSectionVariant = "glass" | "solid" | "admin";
