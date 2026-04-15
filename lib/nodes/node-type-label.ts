/**
 * Human-readable labels for Prisma `NodeType` (dashboard + marketing alignment).
 * Strings are English sources for `useAutoTranslate` on non-en locales.
 */
export const NODE_TYPE_ORDER = ["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"] as const;
export type NodeTypeId = (typeof NODE_TYPE_ORDER)[number];

const NODE_TYPE_LABEL_EN: Record<NodeTypeId, string> = {
  GLOBAL: "Global node",
  REGION: "Region node",
  CITY: "City node",
  INDUSTRY: "Industry node",
  FUNCTIONAL: "Functional node",
  AGENT: "Agent node",
};

export function formatNodeType(type: string, t: (s: string) => string): string {
  if (type in NODE_TYPE_LABEL_EN) return t(NODE_TYPE_LABEL_EN[type as NodeTypeId]);
  return type;
}
