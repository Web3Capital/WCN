/**
 * @wcn/realtime — Port Definitions
 */

export interface RealtimePort {
  broadcast(event: string, data: Record<string, unknown>): void;
  addClient(id: string, controller: ReadableStreamDefaultController): void;
  removeClient(id: string): void;
}
