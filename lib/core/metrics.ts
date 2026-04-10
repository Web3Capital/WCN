/**
 * WCN Metrics Collector
 *
 * Lightweight in-process metrics for observability.
 * Designed to be exported to Prometheus/Datadog/etc. via /api/metrics.
 */

interface Counter {
  name: string;
  help: string;
  value: number;
  labels: Record<string, string>;
}

interface Histogram {
  name: string;
  help: string;
  count: number;
  sum: number;
  labels: Record<string, string>;
}

class MetricsCollector {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Histogram>();

  increment(name: string, labels: Record<string, string> = {}, delta: number = 1): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += delta;
    } else {
      this.counters.set(key, { name, help: "", value: delta, labels });
    }
  }

  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    const existing = this.histograms.get(key);
    if (existing) {
      existing.count++;
      existing.sum += value;
    } else {
      this.histograms.set(key, { name, help: "", count: 1, sum: value, labels });
    }
  }

  snapshot(): { counters: Counter[]; histograms: Histogram[] } {
    return {
      counters: Array.from(this.counters.values()),
      histograms: Array.from(this.histograms.values()),
    };
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

const globalForMetrics = globalThis as unknown as { __wcn_metrics?: MetricsCollector };
if (!globalForMetrics.__wcn_metrics) {
  globalForMetrics.__wcn_metrics = new MetricsCollector();
}

export const metrics = globalForMetrics.__wcn_metrics;

export function trackApiLatency(route: string, method: string, statusCode: number, durationMs: number): void {
  metrics.observe("api_request_duration_ms", durationMs, { route, method, status: String(statusCode) });
  metrics.increment("api_requests_total", { route, method, status: String(statusCode) });
}

export function trackEventEmitted(eventName: string): void {
  metrics.increment("domain_events_total", { event: eventName });
}

export function trackEventHandlerDuration(eventName: string, handlerModule: string, durationMs: number): void {
  metrics.observe("event_handler_duration_ms", durationMs, { event: eventName, module: handlerModule });
}

export function trackAgentRun(agentType: string, status: string, durationMs: number, tokenCount: number): void {
  metrics.increment("agent_runs_total", { type: agentType, status });
  metrics.observe("agent_run_duration_ms", durationMs, { type: agentType });
  metrics.observe("agent_tokens_used", tokenCount, { type: agentType });
}
