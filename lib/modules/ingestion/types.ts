export interface IngestionItem {
  externalId: string;
  name: string;
  type: "project" | "capital" | "node";
  data: Record<string, unknown>;
  source: string;
  url?: string;
}

export interface AdapterResult {
  items: IngestionItem[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface IngestionAdapter {
  readonly name: string;
  readonly type: string;
  fetch(config: Record<string, unknown>, cursor?: string): Promise<AdapterResult>;
}
