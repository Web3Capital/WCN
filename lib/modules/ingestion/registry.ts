import type { IngestionAdapter } from "./types";
import { CrunchbaseAdapter } from "./adapters/crunchbase";
import { DefiLlamaAdapter } from "./adapters/defillama";
import { CustomApiAdapter } from "./adapters/custom-api";

const adapters = new Map<string, IngestionAdapter>();

function register(adapter: IngestionAdapter) {
  adapters.set(adapter.type, adapter);
}

register(new CrunchbaseAdapter());
register(new DefiLlamaAdapter());
register(new CustomApiAdapter());

export function getAdapter(type: string): IngestionAdapter | undefined {
  return adapters.get(type);
}

export function listAdapters(): Array<{ name: string; type: string }> {
  return Array.from(adapters.values()).map((a) => ({ name: a.name, type: a.type }));
}
