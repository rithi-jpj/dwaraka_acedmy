'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (socket && socket.connected) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
  socket = io(url, { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
