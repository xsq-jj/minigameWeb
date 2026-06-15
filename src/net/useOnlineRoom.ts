import { useCallback, useEffect, useRef } from 'react';
import { createGameSocket, disconnectGameSocket, GameSocket } from '@/net/socketClient';
import { buildInviteUrl, buildRoomUrl, getSessionReconnectToken, setSessionReconnectToken } from '@/net/roomUrl';
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

export function useOnlineRoom() {
  const socketRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    const socket = createGameSocket();
    socketRef.current = socket;

    const onConnect = () => useOnlineStore.getState().setConnected(true);
    const onDisconnect = () => useOnlineStore.getState().setConnected(false);
    const onRoomError = (payload: { code: string; message: string }) => useOnlineStore.getState().setError(payload.message);
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

    return () => {
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
          setError(result.message || '创建房间失败');
          return false;
        }
        setSessionReconnectToken(result.roomId, result.reconnectToken);
        const inviteUrl = buildInviteUrl(result.roomId);
        setLobby({ roomId: result.roomId, inviteUrl, mySlot: result.slot, reconnectToken: result.reconnectToken });
        window.history.replaceState({}, '', buildRoomUrl(result.roomId));
        return true;
      } catch {
        setError('连接后端失败，请确认 3001 服务已启动');
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
          setError(result.message || '加入房间失败');
          return false;
        }
        setSessionReconnectToken(result.roomId, result.reconnectToken);
        const inviteUrl = buildInviteUrl(result.roomId);
        setLobby({ roomId: result.roomId, inviteUrl, mySlot: result.slot, reconnectToken: result.reconnectToken });
        window.history.replaceState({}, '', buildRoomUrl(result.roomId));
        return true;
      } catch {
        setError('加入房间超时，请检查房间号或后端服务');
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
        useOnlineStore.getState().setError(result.message || '角色选择失败');
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
        useOnlineStore.getState().setError(result.message || '准备失败');
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
  }, []);

  const disconnect = useCallback(() => {
    disconnectGameSocket();
    useOnlineStore.getState().resetOnline();
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
