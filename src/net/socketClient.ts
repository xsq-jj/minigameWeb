import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/net/protocol';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const LOCAL_SOCKET_URL = 'http://127.0.0.1:3001';

export function getSocketServerUrl(): string {
  return import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? LOCAL_SOCKET_URL : '');
}

let socketSingleton: GameSocket | null = null;

export function createGameSocket(): GameSocket {
  if (socketSingleton) return socketSingleton;
  const url = getSocketServerUrl();

  if (!url) {
    throw new Error('Missing VITE_SOCKET_URL. Set it to the public URL of the Socket.IO backend.');
  }

  socketSingleton = io(url, {
    transports: ['websocket'],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  });
  return socketSingleton;
}

export function disconnectGameSocket() {
  socketSingleton?.disconnect();
  socketSingleton = null;
}
