/**
 * WCN Extension Point Registry
 *
 * Enables fractal scalability: adding new node types, deal types, agent types,
 * or settlement methods requires registration, not modification of core code.
 * This is the Open/Closed Principle applied at system scale.
 */

export interface ExtensionPoint<TConfig, THandler = undefined> {
  register(id: string, config: TConfig, handler?: THandler): void;
  get(id: string): { config: TConfig; handler?: THandler } | undefined;
  list(): Array<{ id: string; config: TConfig }>;
  has(id: string): boolean;
}

class Registry<TConfig, THandler = undefined>
  implements ExtensionPoint<TConfig, THandler>
{
  private entries = new Map<string, { config: TConfig; handler?: THandler }>();
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  register(id: string, config: TConfig, handler?: THandler): void {
    if (this.entries.has(id)) {
      throw new Error(
        `[Registry:${this.name}] Extension '${id}' is already registered.`,
      );
    }
    this.entries.set(id, { config, handler });
  }

  get(id: string): { config: TConfig; handler?: THandler } | undefined {
    return this.entries.get(id);
  }

  list(): Array<{ id: string; config: TConfig }> {
    return Array.from(this.entries.entries()).map(([id, { config }]) => ({
      id,
      config,
    }));
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }
}

export function createRegistry<TConfig, THandler = undefined>(
  name: string,
): ExtensionPoint<TConfig, THandler> {
  return new Registry<TConfig, THandler>(name);
}
