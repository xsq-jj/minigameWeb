import { create } from 'zustand';
import { Character } from '@/data/characters';
import { Particle, ScreenShake } from '@/game/constants';

export type GameScreen = 'title' | 'select' | 'battle' | 'victory' | 'online' | 'onlineBattle';
export type SelectPhase = 'p1' | 'p2';

export interface FighterState {
  id: string;
  character: Character;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  facingRight: boolean;
  isJumping: boolean;
  velocityY: number;
  isAttacking: boolean;
  attackFrame: number;
  currentSkill: number | null;
  skillFrame: number;
  cooldowns: Record<string, number>;
  isShielded: boolean;
  isStunned: boolean;
  damageMultiplier: number;
  hitFlash: number;
  // combo tracking
  combo: number;
  comboTimer: number;
}

interface Projectile {
  id: string;
  owner: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  type: string;
  width: number;
  height: number;
  life: number;
  trailColor: string;
}

interface SkillPopup {
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
}

interface GameStore {
  screen: GameScreen;
  player1: FighterState | null;
  player2: FighterState | null;
  player1Character: Character | null;
  player2Character: Character | null;
  winner: number | null;
  projectiles: Projectile[];
  damageTexts: { x: number; y: number; value: number; color: string; size?: number; isCrit?: boolean }[];
  particles: Particle[];
  screenShake: ScreenShake | null;
  skillPopups: SkillPopup[];
  selectPhase: SelectPhase;
  frameCount: number;
  bossRush: boolean;

  setScreen: (screen: GameScreen) => void;
  setSelectPhase: (phase: SelectPhase) => void;
  setPlayer1Character: (character: Character) => void;
  setPlayer2Character: (character: Character) => void;
  clearSelections: () => void;
  initBattle: () => void;
  setWinner: (player: number | null) => void;
  updateFighter: (player: 1 | 2, updates: Partial<FighterState>) => void;
  addProjectile: (projectile: Projectile) => void;
  removeProjectile: (id: string) => void;
  updateProjectiles: () => void;
  addDamageText: (x: number, y: number, value: number, color: string, opts?: { size?: number; isCrit?: boolean }) => void;
  updateDamageTexts: () => void;
  addParticles: (particles: Particle[]) => void;
  updateParticles: () => void;
  triggerScreenShake: (intensity: number, duration: number) => void;
  addSkillPopup: (text: string, x: number, y: number, color: string) => void;
  updateSkillPopups: () => void;
  setCooldown: (player: 1 | 2, skill: string, frames: number) => void;
  getCooldown: (player: 1 | 2, skill: string) => number;
  incrementFrame: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'title',
  player1: null,
  player2: null,
  player1Character: null,
  player2Character: null,
  winner: null,
  projectiles: [],
  damageTexts: [],
  particles: [],
  screenShake: null,
  skillPopups: [],
  selectPhase: 'p1',
  frameCount: 0,
  bossRush: false,

  setScreen: (screen) => set({ screen }),

  setSelectPhase: (phase) => set({ selectPhase: phase }),

  setPlayer1Character: (character) => set((state) => ({
    player1Character: character,
    player2Character: state.player2Character?.id === character.id ? null : state.player2Character,
  })),

  setPlayer2Character: (character) => set((state) => ({
    player2Character: character,
    player1Character: state.player1Character?.id === character.id ? null : state.player1Character,
  })),

  clearSelections: () => set({
    player1: null,
    player2: null,
    player1Character: null,
    player2Character: null,
    winner: null,
    projectiles: [],
    damageTexts: [],
    particles: [],
    screenShake: null,
    skillPopups: [],
    selectPhase: 'p1',
  }),

  initBattle: () => {
    const { player1Character, player2Character } = get();
    if (!player1Character || !player2Character) return;

    const p1: FighterState = {
      id: 'p1',
      character: player1Character,
      x: 150,
      y: 450,
      hp: player1Character.maxHp,
      maxHp: player1Character.maxHp,
      mp: player1Character.maxMp,
      maxMp: player1Character.maxMp,
      facingRight: true,
      isJumping: false,
      velocityY: 0,
      isAttacking: false,
      attackFrame: 0,
      currentSkill: null,
      skillFrame: 0,
      cooldowns: {},
      isShielded: false,
      isStunned: false,
      damageMultiplier: 1,
      hitFlash: 0,
      combo: 0,
      comboTimer: 0,
    };

    const p2: FighterState = {
      id: 'p2',
      character: player2Character,
      x: 850,
      y: 450,
      hp: player2Character.maxHp,
      maxHp: player2Character.maxHp,
      mp: player2Character.maxMp,
      maxMp: player2Character.maxMp,
      facingRight: false,
      isJumping: false,
      velocityY: 0,
      isAttacking: false,
      attackFrame: 0,
      currentSkill: null,
      skillFrame: 0,
      cooldowns: {},
      isShielded: false,
      isStunned: false,
      damageMultiplier: 1,
      hitFlash: 0,
      combo: 0,
      comboTimer: 0,
    };

    set({ player1: p1, player2: p2, screen: 'battle', winner: null, projectiles: [], damageTexts: [], particles: [], screenShake: null, skillPopups: [] });
  },

  setWinner: (player) => {
    set({ winner: player });
    if (player) {
      setTimeout(() => set({ screen: 'victory' }), 2500);
    }
  },

  updateFighter: (player, updates) => {
    const key = player === 1 ? 'player1' : 'player2';
    set((state) => ({ [key]: state[key] ? { ...state[key], ...updates } : null }));
  },

  addProjectile: (projectile) => {
    set((state) => ({ projectiles: [...state.projectiles, projectile] }));
  },

  removeProjectile: (id) => {
    set((state) => ({ projectiles: state.projectiles.filter((p) => p.id !== id) }));
  },

  updateProjectiles: () => {
    set((state) => ({
      projectiles: state.projectiles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 1,
        }))
        .filter((p) => p.life > 0),
    }));
  },

  addDamageText: (x, y, value, color, opts) => {
    set((state) => ({
      damageTexts: [...state.damageTexts, { x, y, value, color, size: opts?.size, isCrit: opts?.isCrit }],
    }));
  },

  updateDamageTexts: () => {
    set((state) => ({
      damageTexts: state.damageTexts.map((t) => ({ ...t, y: t.y - 1.5 })).slice(0, 30),
    }));
  },

  addParticles: (particles) => {
    set((state) => ({
      particles: [...state.particles, ...particles].slice(-200),
    }));
  },

  updateParticles: () => {
    set((state) => ({
      particles: state.particles
        .map((p) => {
          const newVy = p.vy + (p.gravity ? 0.3 : 0);
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + newVy,
            vy: newVy,
            life: p.life - 1,
            size: p.size * 0.97,
          };
        })
        .filter((p) => p.life > 0 && p.size > 0.5),
    }));
  },

  triggerScreenShake: (intensity, duration) => {
    set({ screenShake: { intensity, duration, elapsed: 0 } });
  },

  addSkillPopup: (text, x, y, color) => {
    set((state) => ({
      skillPopups: [...state.skillPopups.slice(-3), { text, x, y, color, life: 60 }],
    }));
  },

  updateSkillPopups: () => {
    set((state) => ({
      skillPopups: state.skillPopups
        .map((s) => ({ ...s, y: s.y - 1.5, life: s.life - 1 }))
        .filter((s) => s.life > 0),
    }));
  },

  setCooldown: (player, skill, frames) => {
    const key = player === 1 ? 'player1' : 'player2';
    set((state) => {
      const f = state[key];
      if (!f) return state;
      return {
        [key]: {
          ...f,
          cooldowns: { ...f.cooldowns, [skill]: frames },
        },
      };
    });
  },

  getCooldown: (player, skill) => {
    const f = player === 1 ? get().player1 : get().player2;
    return f?.cooldowns[skill] || 0;
  },

  incrementFrame: () => set((state) => ({ frameCount: state.frameCount + 1 })),

  reset: () => {
    set({
      screen: 'title',
      player1: null,
      player2: null,
      player1Character: null,
      player2Character: null,
      winner: null,
      projectiles: [],
      damageTexts: [],
      particles: [],
      screenShake: null,
      skillPopups: [],
      selectPhase: 'p1',
    });
  },
}));
