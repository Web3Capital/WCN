"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type SSEEvent = { event: string; data: unknown };
type SSEHandler = (event: SSEEvent) => void;

export function useRealtimeEvents(handlers?: Record<string, SSEHandler>) {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const es = new EventSource("/api/realtime");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener("notification", (e) => {
      handlersRef.current?.notification?.({ event: "notification", data: JSON.parse(e.data) });
    });

    es.addEventListener("entity_update", (e) => {
      handlersRef.current?.entity_update?.({ event: "entity_update", data: JSON.parse(e.data) });
    });

    es.addEventListener("ping", () => {});

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, []);

  const close = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setConnected(false);
  }, []);

  return { connected, close };
}
