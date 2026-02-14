import { useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:4000';

export function useWebSocket({
  onAgentCreated,
  onAgentStatusUpdated,
  onAgentDeleted,
  onTraceCreated,
  onTraceUpdated,
  onTracesCleared,
  onInit,
}) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000;

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'INIT':
              onInit?.(message.data);
              break;
            case 'AGENT_CREATED':
              onAgentCreated?.(message.data);
              break;
            case 'AGENT_STATUS_UPDATED':
              onAgentStatusUpdated?.(message.data);
              break;
            case 'AGENT_DELETED':
              onAgentDeleted?.(message.data);
              break;
            case 'TRACE_CREATED':
              onTraceCreated?.(message.data);
              break;
            case 'TRACE_UPDATED':
              onTraceUpdated?.(message.data);
              break;
            case 'TRACES_CLEARED':
              onTracesCleared?.();
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return wsRef.current;
}
