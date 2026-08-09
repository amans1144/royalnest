import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { PlotUpdatedEvent } from '@spb/types';

interface UseProjectSocketOptions {
  url: string;
  projectId: string;
  token?: string | null;
  onPlotUpdated?: (event: PlotUpdatedEvent) => void;
}

/**
 * Subscribe to realtime plot updates for a single project.
 * Joins room `project:{id}` and reconciles `plot.updated` events.
 */
export function useProjectSocket({
  url,
  projectId,
  token,
  onPlotUpdated,
}: UseProjectSocketOptions): { connected: boolean; socket: Socket | null } {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // Keep the latest callback without re-subscribing on every render.
  const handlerRef = useRef(onPlotUpdated);
  handlerRef.current = onPlotUpdated;

  useEffect(() => {
    const socket = io(`${url}/realtime`, {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
      autoConnect: true,
    });
    socketRef.current = socket;

    const join = () => {
      setConnected(true);
      socket.emit('project.join', { projectId });
    };
    const onDisconnect = () => setConnected(false);
    const onUpdate = (event: PlotUpdatedEvent) => handlerRef.current?.(event);

    socket.on('connect', join);
    socket.on('disconnect', onDisconnect);
    socket.on('plot.updated', onUpdate);

    return () => {
      socket.emit('project.leave', { projectId });
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socket.off('plot.updated', onUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, projectId, token]);

  return { connected, socket: socketRef.current };
}
