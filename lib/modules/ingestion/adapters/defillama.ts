import type { IngestionAdapter, AdapterResult } from "../types";

/**
 * DeFiLlama adapter — fetches DeFi protocols and their TVL data.
 * No API key required (public API).
 */
export class DefiLlamaAdapter implements IngestionAdapter {
  readonly name = "DeFiLlama";
  readonly type = "defillama";

  async fetch(config: Record<string, unknown>, cursor?: string): Promise<AdapterResult> {
    const minTvl = Number(config.minTvl ?? 0);
    const category = config.category as string | undefined;
    const offset = Number(cursor ?? 0);
    const limit = Math.min(Number(config.limit ?? 50), 200);

    const response = await fetch("https://api.llama.fi/protocols");
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    let protocols: any[] = await response.json();

    if (minTvl > 0) {
      protocols = protocols.filter((p: any) => (p.tvl ?? 0) >= minTvl);
    }
    if (category) {
      protocols = protocols.filter((p: any) => p.category?.toLowerCase() === category.toLowerCase());
    }

    const page = protocols.slice(offset, offset + limit);

    return {
      items: page.map((p: any) => ({
        externalId: `defillama:${p.slug}`,
        name: p.name,
        type: "project" as const,
        source: "defillama",
        url: `https://defillama.com/protocol/${p.slug}`,
        data: {
          description: p.description ?? null,
          tvl: p.tvl ?? 0,
          category: p.category ?? null,
          chains: p.chains ?? [],
          website: p.url ?? null,
          twitter: p.twitter ? `https://twitter.com/${p.twitter}` : null,
          symbol: p.symbol ?? null,
          mcap: p.mcap ?? null,
        },
      })),
      nextCursor: offset + limit < protocols.length ? String(offset + limit) : undefined,
      hasMore: offset + limit < protocols.length,
    };
  }
}
