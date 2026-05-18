import { useEffect, useRef, useState, useCallback } from 'react';
import type { Tool } from '@remote-app/shared';

const WS_URL = 'ws://localhost:3001/ws';
const RECONNECT_DELAY = 3000;

export interface WsMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          setMessages(prev => [...prev.slice(-99), msg]);

          if (msg.type === 'initial:state') {
            const payload = msg.payload as { tools: Tool[] };
            if (payload?.tools) setTools(payload.tools);
          } else if (msg.type === 'tool:status_changed') {
            const payload = msg.payload as { toolId: string; status: string };
            setTools(prev =>
              prev.map(t =>
                t.id === payload.toolId ? { ...t, status: payload.status as Tool['status'] } : t
              )
            );
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, messages, tools };
}
