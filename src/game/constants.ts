export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;
export const GROUND_Y = 450;
export const GRAVITY = 0.8;
export const JUMP_FORCE = -15;

export const FIGHTER_WIDTH = 80;
export const FIGHTER_HEIGHT = 120;

export const HP_BAR_WIDTH = 300;
export const HP_BAR_HEIGHT = 28;
export const MP_BAR_WIDTH = 200;
export const MP_BAR_HEIGHT = 16;

export const CONTROLS = {
  player1: {
    left: 'KeyA',
    right: 'KeyD',
    jump: 'KeyW',
    attack: 'KeyJ',
    skill1: 'KeyK',
    skill2: 'KeyL',
    ultimate: 'KeyI',
  },
  player2: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    attack: 'Digit1',
    skill1: 'Digit2',
    skill2: 'Digit3',
    ultimate: 'Digit0',
  },
};

export const COLORS = {
  background: '#0f0f23',
  ground: '#1a1a2e',
  ui: {
    hp: '#ff4757',
    hpBg: '#2f2f4a',
    mp: '#3498db',
    mpBg: '#2f2f4a',
    panel: 'rgba(20, 20, 40, 0.9)',
    border: '#4a4a6a',
  },
  text: {
    primary: '#ffffff',
    secondary: '#aaaacc',
    accent: '#ffd700',
  },
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'circle' | 'star' | 'spark' | 'ring';
  gravity?: boolean;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
}