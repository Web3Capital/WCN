import type { IngestionAdapter, AdapterResult } from "../types";

/**
 * CrunchBase adapter — fetches companies and investors from the CrunchBase API.
 * Requires CRUNCHBASE_API_KEY in source config.
 */
export class CrunchbaseAdapter implements IngestionAdapter {
  readonly name = "CrunchBase";
  readonly type = "crunchbase";

  async fetch(config: Record<string, unknown>, cursor?: string): Promise<AdapterResult> {
    const apiKey = config.apiKey as string;
    if (!apiKey) throw new Error("CrunchBase adapter requires apiKey in config");

    const sector = (config.sector as string) ?? "web3";
    const limit = Math.min(Number(config.limit ?? 50), 100);
    const after = cursor ?? "";

    const url = `https://api.crunchbase.com/api/v4/searches/organizations`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-cb-user-key": apiKey,
      },
      body: JSON.stringify({
        field_ids: ["identifier", "short_description", "website_url", "founded_on", "categories", "location_identifiers", "funding_total"],
        query: [{ type: "predicate", field_id: "facet_ids", operator_id: "includes", values: [sector] }],
        after_id: after || undefined,
        limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`CrunchBase API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const entities = data.entities ?? [];

    return {
      items: entities.map((e: any) => ({
        externalId: `crunchbase:${e.uuid}`,
        name: e.properties?.identifier?.value ?? e.uuid,
        type: "project" as const,
        source: "crunchbase",
        url: `https://www.crunchbase.com/organization/${e.properties?.identifier?.permalink}`,
        data: {
          description: e.properties?.short_description ?? null,
          website: e.properties?.website_url ?? null,
          foundedOn: e.properties?.founded_on ?? null,
          categories: e.properties?.categories?.map((c: any) => c.value) ?? [],
          location: e.properties?.location_identifiers?.[0]?.value ?? null,
          fundingTotal: e.properties?.funding_total?.value_usd ?? null,
        },
      })),
      nextCursor: data.entities?.length >= limit ? entities[entities.length - 1]?.uuid : undefined,
      hasMore: data.entities?.length >= limit,
    };
  }
}
