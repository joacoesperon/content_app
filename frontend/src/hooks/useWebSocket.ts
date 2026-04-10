import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl } from '../lib/api';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(jobId: string | null) {
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [status, setStatus] = useState<string>('idle');
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!jobId) return;

    const ws = new WebSocket(getWebSocketUrl(jobId));
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);

      if (msg.type === 'status') {
        const s = msg.status as string;
        if (s === 'completed' || s === 'failed') {
          setStatus(s);
        }
      }
    };

    ws.onerror = () => setStatus('error');
    ws.onclose = () => {
      if (status !== 'completed' && status !== 'failed') {
        setStatus('disconnected');
      }
    };
  }, [jobId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus('idle');
  }, []);

  return { messages, status, reset };
}
