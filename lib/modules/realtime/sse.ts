export type SSEClient = {
  id: string;
  userId: string;
  role: string;
  controller: ReadableStreamDefaultController;
};

class SSEManager {
  private clients = new Map<string, SSEClient>();

  add(client: SSEClient): void {
    this.clients.set(client.id, client);
  }

  remove(id: string): void {
    this.clients.delete(id);
  }

  broadcast(event: string, data: unknown, filter?: (c: SSEClient) => boolean): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(payload);

    for (const client of this.clients.values()) {
      if (filter && !filter(client)) continue;
      try {
        client.controller.enqueue(encoded);
      } catch {
        this.clients.delete(client.id);
      }
    }
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    this.broadcast(event, data, (c) => c.userId === userId);
  }

  get size(): number {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
