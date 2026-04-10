import type { IngestionAdapter, AdapterResult, IngestionItem } from "../types";

/**
 * Generic HTTP API adapter — fetches data from any REST API.
 * Allows agent nodes to define custom API endpoints for data ingestion.
 *
 * Config shape:
 * {
 *   url: string,           // API endpoint
 *   method?: "GET" | "POST",
 *   headers?: Record<string, string>,
 *   body?: unknown,
 *   itemsPath?: string,    // JSONPath-like dot notation to items array
 *   mapping: {
 *     externalId: string,  // field path for external ID
 *     name: string,        // field path for name
 *     type: "project" | "capital" | "node",
 *   }
 * }
 */
export class CustomApiAdapter implements IngestionAdapter {
  readonly name = "Custom API";
  readonly type = "custom_api";

  async fetch(config: Record<string, unknown>, cursor?: string): Promise<AdapterResult> {
    let url = config.url as string;
    if (!url) throw new Error("Custom API adapter requires 'url' in config");

    const method = (config.method as string) ?? "GET";
    const headers = (config.headers as Record<string, string>) ?? {};
    const mapping = config.mapping as { externalId: string; name: string; type: string };
    if (!mapping) throw new Error("Custom API adapter requires 'mapping' in config");

    if (cursor) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}cursor=${encodeURIComponent(cursor)}`;
    }

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: method === "POST" ? JSON.stringify(config.body ?? {}) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const itemsPath = config.itemsPath as string | undefined;
    let rawItems: any[] = data;
    if (itemsPath) {
      rawItems = getNestedValue(data, itemsPath) as any[] ?? [];
    }
    if (!Array.isArray(rawItems)) rawItems = [rawItems];

    const items: IngestionItem[] = rawItems.map((item: any) => ({
      externalId: `custom:${getNestedValue(item, mapping.externalId)}`,
      name: String(getNestedValue(item, mapping.name) ?? "Unknown"),
      type: (mapping.type ?? "project") as IngestionItem["type"],
      source: new URL(url).hostname,
      data: item,
    }));

    const nextCursor = data.nextCursor ?? data.next_cursor ?? data.cursor;

    return {
      items,
      nextCursor: nextCursor ? String(nextCursor) : undefined,
      hasMore: !!nextCursor,
    };
  }
}

function getNestedValue(obj: any, path: string): unknown {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}
