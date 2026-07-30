'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let listenersAttached = false;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (socket?.connected) return socket;
  
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000';
  
  if (socket) {
    // Reconnect if disconnected
    socket.connect();
    return socket;
  }
  
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[socket] Connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] Connection error:', err.message);
  });

  listenersAttached = false;
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    listenersAttached = false;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function onSocketEvent(event: string, handler: (...args: any[]) => void) {
  const s = getSocket();
  if (!s) return () => {};
  s.off(event, handler);
  s.on(event, handler);
  return () => {
    s.off(event, handler);
  };
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
