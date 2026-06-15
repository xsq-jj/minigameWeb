import { create } from 'zustand';
import { BattleStartPayload, GameEvent, GameSnapshot, PlayerSlot, PublicRoomState } from '@/net/protocol';

export type OnlineStage = 'idle' | 'lobby' | 'battle' | 'ended';

interface OnlineStore {
  stage: OnlineStage;
  connected: boolean;
  roomId: string | null;
  inviteUrl: string | null;
  mySlot: PlayerSlot | null;
  reconnectToken: string | null;
  roomState: PublicRoomState | null;
  battleStart: BattleStartPayload | null;
  snapshot: GameSnapshot | null;
  events: GameEvent[];
  winner: PlayerSlot | null;
  error: string | null;

  setConnected: (connected: boolean) => void;
  setLobby: (payload: { roomId: string; inviteUrl: string; mySlot: PlayerSlot; reconnectToken: string }) => void;
  setRoomState: (roomState: PublicRoomState) => void;
  setBattleStart: (battleStart: BattleStartPayload) => void;
  setSnapshot: (snapshot: GameSnapshot) => void;
  addEvents: (events: GameEvent[]) => void;
  setGameOver: (winner: PlayerSlot) => void;
  setError: (error: string | null) => void;
  resetOnline: () => void;
}

export const useOnlineStore = create<OnlineStore>((set) => ({
  stage: 'idle',
  connected: false,
  roomId: null,
  inviteUrl: null,
  mySlot: null,
  reconnectToken: null,
  roomState: null,
  battleStart: null,
  snapshot: null,
  events: [],
  winner: null,
  error: null,

  setConnected: (connected) => set({ connected }),
  setLobby: ({ roomId, inviteUrl, mySlot, reconnectToken }) =>
    set({ stage: 'lobby', roomId, inviteUrl, mySlot, reconnectToken, error: null }),
  setRoomState: (roomState) =>
    set((state) => {
      if (roomState.status === 'lobby' || roomState.status === 'countdown') {
        return {
          roomState,
          stage: state.roomId ? 'lobby' : state.stage,
          snapshot: null,
          battleStart: null,
          events: [],
          winner: roomState.winner ?? null,
        };
      }
      if (roomState.status === 'playing') {
        return { roomState, stage: 'battle', winner: roomState.winner ?? null };
      }
      if (roomState.status === 'ended') {
        return { roomState, stage: 'ended', winner: roomState.winner ?? state.winner };
      }
      return { roomState, winner: roomState.winner ?? null };
    }),
  setBattleStart: (battleStart) => set({ stage: 'battle', battleStart, winner: null, events: [], snapshot: null }),
  setSnapshot: (snapshot) => set({ snapshot, winner: snapshot.winner }),
  addEvents: (events) => set((state) => ({ events: [...state.events, ...events].slice(-40) })),
  setGameOver: (winner) => set({ stage: 'ended', winner }),
  setError: (error) => set({ error }),
  resetOnline: () =>
    set({
      stage: 'idle',
      connected: false,
      roomId: null,
      inviteUrl: null,
      mySlot: null,
      reconnectToken: null,
      roomState: null,
      battleStart: null,
      snapshot: null,
      events: [],
      winner: null,
      error: null,
    }),
}));
