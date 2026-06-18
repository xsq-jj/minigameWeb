import { useCallback, useEffect, useRef } from 'react';
import { onlineError, onlineErrorCodes } from '@/i18n/errorText';
import { createGameSocket, disconnectGameSocket, GameSocket } from '@/net/socketClient';
import { buildInviteUrl, buildRoomUrl, clearRoomFromUrl, getSessionReconnectToken, setSessionReconnectToken } from '@/net/roomUrl';
import { AckResult, CreateRoomResult, JoinRoomResult, PlayerInput } from '@/net/protocol';
import { useOnlineStore } from '@/store/onlineStore';

function createRoomAck(socket: GameSocket, payload: { nickname?: string }): Promise<CreateRoomResult> {
  return new Promise((resolve, reject) => {
    socket.timeout(4000).emit('room:create', payload, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function joinRoomAck(socket: GameSocket, payload: { roomId: string; nickname?: string; reconnectToken?: string }): Promise<JoinRoomResult> {
  return new Promise((resolve, reject) => {
    socket.timeout(4000).emit('room:join', payload, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function selectCharacterAck(socket: GameSocket, payload: { roomId: string; characterId: string }): Promise<AckResult> {
  return new Promise((resolve, reject) => {
    socket.timeout(4000).emit('player:select-character', payload, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function readyAck(socket: GameSocket, payload: { roomId: string; ready: boolean }): Promise<AckResult> {
  return new Promise((resolve, reject) => {
    socket.timeout(4000).emit('player:ready', payload, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function measurePing(socket: GameSocket): void {
  if (!socket.connected) return;
  const clientTime = performance.now();
  socket.timeout(1000).emit('ping:measure', { clientTime }, (err, result) => {
    if (err || !result?.ok) return;
    useOnlineStore.getState().setPingMs(Math.round(performance.now() - result.clientTime));
  });
}

export function useOnlineRoom() {
  const socketRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    let socket: GameSocket;
    try {
      socket = createGameSocket();
    } catch (error) {
      useOnlineStore.getState().setError(
        onlineError(onlineErrorCodes.SOCKET_NOT_CONFIGURED, error instanceof Error ? error.message : undefined)
      );
      return;
    }

    socketRef.current = socket;

    const onConnect = () => useOnlineStore.getState().setConnected(true);
    const onDisconnect = () => useOnlineStore.getState().setConnected(false);
    const onRoomError = (payload: { code: string; message: string }) => useOnlineStore.getState().setError(onlineError(payload.code, payload.message));
    const onGameOver = (payload: { roomId: string; winner: 1 | 2 }) => useOnlineStore.getState().setGameOver(payload.winner);
    const onRoomState = useOnlineStore.getState().setRoomState;
    const onBattleStart = useOnlineStore.getState().setBattleStart;
    const onSnapshot = useOnlineStore.getState().setSnapshot;
    const onEvents = useOnlineStore.getState().addEvents;

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', onRoomState);
    socket.on('room:error', onRoomError);
    socket.on('battle:start', onBattleStart);
    socket.on('battle:snapshot', onSnapshot);
    socket.on('battle:events', onEvents);
    socket.on('battle:game-over', onGameOver);
    if (socket.connected) useOnlineStore.getState().setConnected(true);
    measurePing(socket);
    const pingTimer = window.setInterval(() => measurePing(socket), 2000);

    return () => {
      window.clearInterval(pingTimer);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', onRoomState);
      socket.off('room:error', onRoomError);
      socket.off('battle:start', onBattleStart);
      socket.off('battle:snapshot', onSnapshot);
      socket.off('battle:events', onEvents);
      socket.off('battle:game-over', onGameOver);
      socketRef.current = null;
    };
  }, []);

  const createRoom = useCallback(
    async (nickname: string) => {
      const socket = socketRef.current;
      if (!socket) return false;
      const { setError, setLobby } = useOnlineStore.getState();
      setError(null);
      try {
        const result = await createRoomAck(socket, { nickname });
        if (!result.ok || !result.roomId || !result.slot || !result.reconnectToken) {
          setError(onlineError(result.error || onlineErrorCodes.CREATE_ROOM_FAILED, result.message));
          return false;
        }
        setSessionReconnectToken(result.roomId, result.reconnectToken);
        const inviteUrl = buildInviteUrl(result.roomId);
        setLobby({ roomId: result.roomId, inviteUrl, mySlot: result.slot, reconnectToken: result.reconnectToken });
        window.history.replaceState({}, '', buildRoomUrl(result.roomId));
        return true;
      } catch {
        setError(onlineError(onlineErrorCodes.BACKEND_CONNECT_FAILED));
        return false;
      }
    },
    []
  );

  const joinRoom = useCallback(
    async (targetRoomId: string, nickname: string, options?: { asNewPlayer?: boolean }) => {
      const socket = socketRef.current;
      if (!socket) return false;
      const { setError, setLobby } = useOnlineStore.getState();
      setError(null);
      try {
        const reconnectToken = options?.asNewPlayer ? undefined : getSessionReconnectToken(targetRoomId);
        const result = await joinRoomAck(socket, { roomId: targetRoomId, nickname, reconnectToken });
        if (!result.ok || !result.roomId || !result.slot || !result.reconnectToken) {
          setError(onlineError(result.error || onlineErrorCodes.JOIN_ROOM_FAILED, result.message));
          return false;
        }
        setSessionReconnectToken(result.roomId, result.reconnectToken);
        const inviteUrl = buildInviteUrl(result.roomId);
        setLobby({ roomId: result.roomId, inviteUrl, mySlot: result.slot, reconnectToken: result.reconnectToken });
        window.history.replaceState({}, '', buildRoomUrl(result.roomId));
        return true;
      } catch {
        setError(onlineError(onlineErrorCodes.JOIN_ROOM_TIMEOUT));
        return false;
      }
    },
    []
  );

  const selectCharacter = useCallback(
    async (characterId: string) => {
      const socket = socketRef.current;
      const currentRoomId = useOnlineStore.getState().roomId;
      if (!socket || !currentRoomId) return false;
      const result = await selectCharacterAck(socket, { roomId: currentRoomId, characterId });
      if (!result.ok) {
        useOnlineStore.getState().setError(onlineError(result.error || onlineErrorCodes.SELECT_CHARACTER_FAILED, result.message));
        return false;
      }
      return true;
    },
    []
  );

  const setReady = useCallback(
    async (ready: boolean) => {
      const socket = socketRef.current;
      const currentRoomId = useOnlineStore.getState().roomId;
      if (!socket || !currentRoomId) return false;
      const result = await readyAck(socket, { roomId: currentRoomId, ready });
      if (!result.ok) {
        useOnlineStore.getState().setError(onlineError(result.error || onlineErrorCodes.READY_FAILED, result.message));
        return false;
      }
      return true;
    },
    []
  );

  const sendInput = useCallback((input: PlayerInput) => {
    const socket = socketRef.current;
    const currentRoomId = useOnlineStore.getState().roomId;
    if (!socket || !currentRoomId || !socket.connected) return;
    socket.volatile.emit('battle:input', { roomId: currentRoomId, input });
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    const roomId = useOnlineStore.getState().roomId;
    if (socket && roomId) {
      socket.emit('room:leave', { roomId });
    }
    useOnlineStore.getState().resetOnline();
    clearRoomFromUrl();
  }, []);

  const disconnect = useCallback(() => {
    disconnectGameSocket();
    useOnlineStore.getState().resetOnline();
    clearRoomFromUrl();
  }, []);

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    selectCharacter,
    setReady,
    sendInput,
    leaveRoom,
    disconnect,
  };
}
