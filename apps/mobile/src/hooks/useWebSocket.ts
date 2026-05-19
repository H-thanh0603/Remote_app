import { useEffect, useRef, useState, useCallback } from 'react';
import type { Tool } from '@remote-app/shared';

const WS_URL = 'ws://localhost:3001/ws';
const RECONNECT_DELAY = 3000;

export interface WsMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export interface TaskEvent {
  type: 'started' | 'progress' | 'completed' | 'failed';
  taskId: string;
  toolName?: string;
  progressText?: string;
  result?: string;
  error?: string;
  duration?: number;
  tokensUsed?: number;
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [taskEvent, setTaskEvent] = useState<TaskEvent | null>(null);
  const [lastEvent, setLastEvent] = useState<{ type: string; data?: unknown } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setReconnecting(false);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          setMessages(prev => [...prev.slice(-99), msg]);
          setLastEvent({ type: msg.type, data: msg.payload });

          switch (msg.type) {
            case 'initial:state': {
              const payload = msg.payload as { tools: Tool[] };
              if (payload?.tools) setTools(payload.tools);
              break;
            }
            case 'tool:status_changed': {
              const payload = msg.payload as { toolId: string; status: string };
              setTools(prev =>
                prev.map(t =>
                  t.id === payload.toolId ? { ...t, status: payload.status as Tool['status'] } : t
                )
              );
              break;
            }
            case 'task:started': {
              const payload = msg.payload as { taskId: string; toolName: string };
              setTaskEvent({
                type: 'started',
                taskId: payload.taskId,
                toolName: payload.toolName,
              });
              break;
            }
            case 'task:progress': {
              const payload = msg.payload as { taskId: string; progressText: string };
              setTaskEvent({
                type: 'progress',
                taskId: payload.taskId,
                progressText: payload.progressText,
              });
              break;
            }
            case 'task:completed': {
              const payload = msg.payload as {
                taskId: string;
                result: string;
                toolName: string;
                duration: number;
                tokensUsed: number;
              };
              setTaskEvent({
                type: 'completed',
                taskId: payload.taskId,
                result: payload.result,
                toolName: payload.toolName,
                duration: payload.duration,
                tokensUsed: payload.tokensUsed,
              });
              break;
            }
            case 'task:failed': {
              const payload = msg.payload as { taskId: string; error: string };
              setTaskEvent({
                type: 'failed',
                taskId: payload.taskId,
                error: payload.error,
              });
              break;
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        setReconnecting(true);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setReconnecting(true);
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

  return { connected, reconnecting, messages, tools, taskEvent, lastEvent };
}
