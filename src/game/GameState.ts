import { Character } from '@/data/characters';
import { Particle } from '@/game/constants';

// ─── Interfaces ─────────────────────────────────────────────
export interface FighterState {
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
  isBlocking: boolean;
  damageMultiplier: number;
  hitFlash: number;
  combo: number;
  comboTimer: number;
}

export interface Projectile {
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

export interface DamageText {
  x: number; y: number; value: number; color: string; size?: number; isCrit?: boolean;
}

export interface SkillPopup {
  text: string; x: number; y: number; color: string; life: number;
}

export interface ScreenShake {
  intensity: number; duration: number; elapsed: number;
}

let projIdCounter = 0;
export function nextProjId(): string {
  return `proj_${++projIdCounter}`;
}

// ─── Factory ────────────────────────────────────────────────
export function createFighter(char: Character, x: number, y: number, facingRight: boolean): FighterState {
  return {
    character: char,
    x, y,
    hp: char.maxHp,
    maxHp: char.maxHp,
    mp: char.maxMp,
    maxMp: char.maxMp,
    facingRight,
    isJumping: false,
    velocityY: 0,
    isAttacking: false,
    attackFrame: 0,
    currentSkill: null,
    skillFrame: 0,
    cooldowns: {},
    isShielded: false,
    isStunned: false,
    isBlocking: false,
    damageMultiplier: 1,
    hitFlash: 0,
    combo: 0,
    comboTimer: 0,
  };
}

// ─── GameState (Mutable, NOT React state) ──────────────────
export class GameState {
  p1!: FighterState;
  p2!: FighterState;
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  damageTexts: DamageText[] = [];
  skillPopups: SkillPopup[] = [];
  screenShake: ScreenShake | null = null;
  frameCount = 0;
  winner: number | null = null;
  winnerTimer = 0;

  init(char1: Character, char2: Character) {
    this.p1 = createFighter(char1, 150, 450, true);
    this.p2 = createFighter(char2, 850, 450, false);
    this.projectiles = [];
    this.particles = [];
    this.damageTexts = [];
    this.skillPopups = [];
    this.screenShake = null;
    this.frameCount = 0;
    this.winner = null;
    this.winnerTimer = 0;
  }

  addParticles(newP: Particle[]) {
    this.particles.push(...newP);
    if (this.particles.length > 250) {
      this.particles = this.particles.slice(-250);
    }
  }

  addProjectile(p: Projectile) {
    this.projectiles.push(p);
  }

  addDamageText(x: number, y: number, value: number, color: string, opts?: { size?: number; isCrit?: boolean }) {
    this.damageTexts.push({ x, y, value, color, ...opts });
    if (this.damageTexts.length > 30) {
      this.damageTexts = this.damageTexts.slice(-30);
    }
  }

  addSkillPopup(text: string, x: number, y: number, color: string) {
    this.skillPopups.push({ text, x, y, color, life: 60 });
    if (this.skillPopups.length > 5) {
      this.skillPopups = this.skillPopups.slice(-5);
    }
  }

  getFighter(owner: 1 | 2): FighterState {
    return owner === 1 ? this.p1 : this.p2;
  }

  getOpponent(owner: 1 | 2): FighterState {
    return owner === 1 ? this.p2 : this.p1;
  }
}

// Singleton for the current battle
export const gameState = new GameState();