export type PlayerSlot = 1 | 2;
export type RoomStatus = 'lobby' | 'countdown' | 'playing' | 'paused' | 'ended';

export interface PlayerInput {
  seq: number;
  clientTime: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  skill1: boolean;
  skill2: boolean;
  ultimate: boolean;
}

export interface AckResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export interface CreateRoomResult extends AckResult {
  roomId?: string;
  slot?: PlayerSlot;
  reconnectToken?: string;
}

export interface JoinRoomResult extends AckResult {
  roomId?: string;
  slot?: PlayerSlot;
  reconnectToken?: string;
}

export interface PublicRoomPlayer {
  slot: PlayerSlot;
  nickname: string;
  characterId: string | null;
  ready: boolean;
  connected: boolean;
}

export interface PublicRoomState {
  roomId: string;
  status: RoomStatus;
  players: PublicRoomPlayer[];
  countdownEndsAt?: number;
  winner?: PlayerSlot | null;
}

export interface FighterSnapshot {
  characterId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  facingRight: boolean;
  isJumping: boolean;
  isAttacking: boolean;
  currentSkill: number | null;
  isShielded: boolean;
  isStunned: boolean;
  isBlocking: boolean;
  hitFlash: number;
  combo: number;
}

export interface ProjectileSnapshot {
  id: string;
  owner: PlayerSlot;
  x: number;
  y: number;
  type: string;
  trailColor: string;
}

export interface GameSnapshot {
  frame: number;
  serverTime: number;
  p1: FighterSnapshot;
  p2: FighterSnapshot;
  projectiles: ProjectileSnapshot[];
  winner: PlayerSlot | null;
}

export type GameEvent =
  | { type: 'hit'; frame: number; target: PlayerSlot; x: number; y: number; damage: number; crit?: boolean }
  | { type: 'skill'; frame: number; owner: PlayerSlot; skillIndex: number; skillName: string }
  | { type: 'gameOver'; frame: number; winner: PlayerSlot };

export interface BattleStartPayload {
  roomId: string;
  startedAt: number;
  p1CharacterId: string;
  p2CharacterId: string;
}

export interface ServerToClientEvents {
  'room:state': (state: PublicRoomState) => void;
  'room:error': (payload: { code: string; message: string }) => void;
  'battle:start': (payload: BattleStartPayload) => void;
  'battle:snapshot': (snapshot: GameSnapshot) => void;
  'battle:events': (events: GameEvent[]) => void;
  'battle:game-over': (payload: { roomId: string; winner: PlayerSlot }) => void;
}

export interface ClientToServerEvents {
  'room:create': (payload: { nickname?: string }, ack: (result: CreateRoomResult) => void) => void;
  'room:join': (
    payload: { roomId: string; nickname?: string; reconnectToken?: string },
    ack: (result: JoinRoomResult) => void
  ) => void;
  'room:leave': (payload: { roomId: string }) => void;
  'player:select-character': (
    payload: { roomId: string; characterId: string },
    ack: (result: AckResult) => void
  ) => void;
  'player:ready': (payload: { roomId: string; ready: boolean }, ack: (result: AckResult) => void) => void;
  'battle:input': (payload: { roomId: string; input: PlayerInput }) => void;
  'ping:measure': (
    payload: { clientTime: number },
    ack: (result: { ok: true; clientTime: number; serverTime: number }) => void
  ) => void;
}
