import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/net/protocol';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketSingleton: GameSocket | null = null;

export function createGameSocket(): GameSocket {
  if (socketSingleton) return socketSingleton;
  const url = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:3001';
  socketSingleton = io(url, {
    transports: ['websocket'],
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
