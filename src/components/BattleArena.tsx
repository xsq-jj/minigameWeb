import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameState, GameState } from '@/game/GameState';
import { tick } from '@/game/engine';
import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT,
  HP_BAR_WIDTH, HP_BAR_HEIGHT, MP_BAR_WIDTH, MP_BAR_HEIGHT,
  CONTROLS, Particle,
} from '@/game/constants';

// ─── React-friendly snapshot of game state for UI ──────
interface UISnapshot {
  p1Pos: { x: number; y: number; facingRight: boolean };
  p2Pos: { x: number; y: number; facingRight: boolean };
  p1Stats: { hp: number; maxHp: number; mp: number; maxMp: number; combo: number; isShielded: boolean; isStunned: boolean; isBlocking: boolean; hitFlash: number; isAttacking: boolean; name: string; color: string; sprite: string };
  p2Stats: { hp: number; maxHp: number; mp: number; maxMp: number; combo: number; isShielded: boolean; isStunned: boolean; isBlocking: boolean; hitFlash: number; isAttacking: boolean; name: string; color: string; sprite: string };
  projectiles: { id: string; x: number; y: number; type: string; color: string }[];
  damageTexts: { x: number; y: number; value: number; color: string; size?: number; isCrit?: boolean }[];
  skillPopups: { text: string; x: number; y: number; color: string; life: number }[];
  screenShake: { intensity: number; duration: number; elapsed: number } | null;
}

function snapState(g: GameState): UISnapshot {
  const p1 = g.p1; const p2 = g.p2;
  return {
    p1Pos: { x: p1.x, y: p1.y, facingRight: p1.facingRight },
    p2Pos: { x: p2.x, y: p2.y, facingRight: p2.facingRight },
    p1Stats: { hp: p1.hp, maxHp: p1.maxHp, mp: p1.mp, maxMp: p1.maxMp, combo: p1.combo, isShielded: p1.isShielded, isStunned: p1.isStunned, isBlocking: p1.isBlocking, hitFlash: p1.hitFlash, isAttacking: p1.isAttacking, name: p1.character.name, color: p1.character.color, sprite: p1.character.sprite },
    p2Stats: { hp: p2.hp, maxHp: p2.maxHp, mp: p2.mp, maxMp: p2.maxMp, combo: p2.combo, isShielded: p2.isShielded, isStunned: p2.isStunned, isBlocking: p2.isBlocking, hitFlash: p2.hitFlash, isAttacking: p2.isAttacking, name: p2.character.name, color: p2.character.color, sprite: p2.character.sprite },
    projectiles: g.projectiles.map((p) => ({ id: p.id, x: p.x, y: p.y, type: p.type, color: p.trailColor })),
    damageTexts: g.damageTexts.map((d) => ({ ...d })),
    skillPopups: g.skillPopups.map((s) => ({ ...s })),
    screenShake: g.screenShake ? { ...g.screenShake } : null,
  };
}

// ─── Rendering helpers ──────────────────────────────────
function drawBackground(ctx: CanvasRenderingContext2D) {
  const w = GAME_WIDTH; const h = GAME_HEIGHT - 100;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a0a1a'); sky.addColorStop(0.4, '#14142e');
  sky.addColorStop(0.7, '#1a1a3e'); sky.addColorStop(1, '#0f0f23');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff22';
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137.5 + 50) % w;
    const sy = (i * 97.3 + 20) % (h * 0.4);
    ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#0d0d20';
  for (let i = 0; i < 12; i++) {
    const bx = i * 88 + 10, bh = 80 + (i * 37) % 120, bw = 70 + (i * 23) % 40;
    ctx.fillRect(bx, h - 130 + bh, bw, bh);
    ctx.fillStyle = i % 2 === 0 ? '#ffd70015' : '#3498db15';
    for (let wy = 0; wy < bh - 20; wy += 25)
      for (let wx = 8; wx < bw - 8; wx += 20)
        if (Math.sin(i + wx + wy) > 0.3) ctx.fillRect(bx + wx, h - 120 + bh + wy, 10, 12);
    ctx.fillStyle = '#0d0d20';
  }
  const gd = ctx.createLinearGradient(0, h - 100, 0, h);
  gd.addColorStop(0, '#1a1a2e'); gd.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = gd; ctx.fillRect(0, h - 100, w, 100);
  ctx.strokeStyle = '#4a4a6a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, h - 100); ctx.lineTo(w, h - 100); ctx.stroke();
  ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, h - 100); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = h - 100; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.font = '28px serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#1a1a30'; ctx.fillRect(10, h - 80, 80, 50);
  ctx.strokeStyle = '#3a3a5a'; ctx.lineWidth = 1; ctx.strokeRect(10, h - 80, 80, 50);
  ctx.font = '20px serif'; ctx.fillStyle = '#4a4a6a'; ctx.fillText('🖥️', 50, h - 55);
  ctx.fillStyle = '#1a1a30'; ctx.fillRect(w - 90, h - 80, 80, 50);
  ctx.strokeStyle = '#3a3a5a'; ctx.lineWidth = 1; ctx.strokeRect(w - 90, h - 80, 80, 50);
  ctx.fillStyle = '#4a4a6a'; ctx.fillText('🪴', w - 50, h - 55);
  ctx.font = '24px serif'; ctx.fillStyle = '#3a3a5a';
  ctx.fillText('🚰', 20, h - 10); ctx.fillText('📎', w - 20, h - 10);
  const gg = ctx.createRadialGradient(w / 2, h - 120, 50, w / 2, h - 120, 200);
  gg.addColorStop(0, '#ffffff05'); gg.addColorStop(1, 'transparent');
  ctx.fillStyle = gg; ctx.fillRect(0, h - 200, w, 200);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const a = p.life / Math.max(p.maxLife, 1);
    ctx.globalAlpha = a;
    switch (p.type) {
      case 'circle':
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        break;
      case 'spark':
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 2);
        ctx.shadowBlur = 0;
        break;
      case 'star':
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 15;
        ctx.fillRect(p.x - 1, p.y - p.size / 2, 2, p.size);
        ctx.fillRect(p.x - p.size / 2, p.y - 1, p.size, 2);
        ctx.shadowBlur = 0;
        break;
      case 'ring':
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
        ctx.globalAlpha = a * 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.size * 4 - p.life), 0, Math.PI * 2); ctx.stroke();
        break;
    }
  }
  ctx.globalAlpha = 1;
}

// ─── Emoji for projectiles ──────────────────────────────
const projEmojis: Record<string, string> = {
  '代码注入': '⌨️', '键盘弹幕': '⌨️', '绩效谈话': '📋', '裁员风暴': '📄',
  '报销单据': '📄', '财务审计': '🧮', '名片飞射': '💳', '签单时刻': '📝',
  '会议室预定': '📅', '组织团建': '🧺', '系统崩溃': '💻', '精确预算': '💰',
};

// ─── MAIN COMPONENT ─────────────────────────────────────
export default function BattleArena() {
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const justPressedRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const setScreen = useGameStore((s) => s.setScreen);
  const setSelectPhase = useGameStore((s) => s.setSelectPhase);
  const p1Char = useGameStore((s) => s.player1Character);
  const p2Char = useGameStore((s) => s.player2Character);

  // The mutable game state lives in a ref — React never sees it
  const stateRef = useRef(gameState);

  // Initialize game state BEFORE the useState snapshot (must come before useState)
  const initRef = useRef(false);
  if (!initRef.current) {
    const store = useGameStore.getState();
    if (store.player1Character && store.player2Character) {
      gameState.init(store.player1Character, store.player2Character);
      initRef.current = true;
    }
  }

  // React UI snapshot — synced from game state every N frames
  const [ui, setUI] = useState<UISnapshot>(() => snapState(stateRef.current));

  // Draw background once
  useEffect(() => {
    const c = bgCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (ctx) drawBackground(ctx);
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!keysRef.current.has(e.code)) justPressedRef.current.add(e.code);
      keysRef.current.add(e.code);
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.code); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Game loop
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      try {
        const s = stateRef.current;

        // ── Tick game logic (mutates stateRef directly) ──
        tick(s, keysRef.current, justPressedRef.current);
        justPressedRef.current.clear();

        // ── Draw particles on foreground canvas ──
        const fc = fgCanvasRef.current;
        if (fc) {
          const ctx = fc.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT - 100);
            drawParticles(ctx, s.particles);
          }
        }

        // ── Sync UI snapshot to React every 4 frames (~15fps) ──
        frameRef.current++;
        if (frameRef.current % 4 === 0) {
          setUI(snapState(s));
        }

        // ── Check victory (every frame) ──
        if (s.winner && s.winnerTimer >= 150) {
          const store = useGameStore.getState();
          store.setWinner(s.winner);
          setTimeout(() => store.setScreen('victory'), 2500);
          running = false;
          return;
        }
      } catch (e) {
        console.error('Game loop error:', e);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, []);

  // ─── Render ───────────────────────────────────────────
  const p1 = ui.p1Stats; const p2 = ui.p2Stats;
  const p1p = ui.p1Pos; const p2p = ui.p2Pos;

  // Screen shake CSS
  let sx = 0, sy = 0;
  if (ui.screenShake) {
    const p = ui.screenShake.elapsed / ui.screenShake.duration;
    const i = ui.screenShake.intensity * (1 - p);
    sx = (Math.random() - 0.5) * i * 2;
    sy = (Math.random() - 0.5) * i * 2;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a1a', overflow: 'hidden' }}>
      {/* HUD */}
      <div style={{ width: GAME_WIDTH, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 24px', background: 'linear-gradient(180deg, #0f0f28 0%, #151530 100%)', borderBottom: '2px solid #2a2a4a', zIndex: 5 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '40%', gap: 4 }}>
          <Bar c={p1.hp} m={p1.maxHp} color="#ff4757" w={HP_BAR_WIDTH} h={HP_BAR_HEIGHT} label="HP" />
          <Bar c={p1.mp} m={p1.maxMp} color="#3498db" w={MP_BAR_WIDTH} h={MP_BAR_HEIGHT} label="MP" />
          {p1.combo >= 2 && <ComboText n={p1.combo} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <div style={{ fontSize: 22, color: '#ffd700', textShadow: '0 0 15px #ffd700', fontWeight: 'bold' }}>VS</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '40%', gap: 4 }}>
          <Bar c={p2.hp} m={p2.maxHp} color="#ff4757" w={HP_BAR_WIDTH} h={HP_BAR_HEIGHT} label="HP" />
          <Bar c={p2.mp} m={p2.maxMp} color="#3498db" w={MP_BAR_WIDTH} h={MP_BAR_HEIGHT} label="MP" />
          {p2.combo >= 2 && <ComboText n={p2.combo} />}
        </div>
      </div>

      {/* Game area */}
      <div style={{ width: GAME_WIDTH, height: GAME_HEIGHT - 100, margin: '0 auto', position: 'relative', overflow: 'hidden', transform: `translate(${sx}px,${sy}px)` }}>
        {/* Background canvas */}
        <canvas ref={bgCanvasRef} width={GAME_WIDTH} height={GAME_HEIGHT - 100} style={{ position: 'absolute', top: 0, left: 0 }} />
        {/* Foreground canvas (particles) */}
        <canvas ref={fgCanvasRef} width={GAME_WIDTH} height={GAME_HEIGHT - 100} style={{ position: 'absolute', top: 0, left: 0, zIndex: 5 }} />

        {/* Projectiles */}
        {ui.projectiles.map((p) => (
          <div key={p.id} style={{ position: 'absolute', left: p.x - 20, top: p.y - 15, fontSize: 30, filter: `drop-shadow(0 0 15px ${p.color})`, zIndex: 8 }}>
            {projEmojis[p.type] || '⚡'}
          </div>
        ))}

        {/* Fighter 1 */}
        <FighterDiv pos={p1p} stats={p1} />
        {/* Fighter 2 */}
        <FighterDiv pos={p2p} stats={p2} flip />

        {/* Skill popups */}
        {ui.skillPopups.map((sp, i) => (
          <div key={`sp-${i}`} style={{ position: 'absolute', left: sp.x - 80, top: sp.y, width: 160, textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: sp.color, textShadow: `0 0 20px ${sp.color}`, opacity: Math.min(1, sp.life / 20), pointerEvents: 'none', zIndex: 20, whiteSpace: 'nowrap' }}>
            ⚡ {sp.text} ⚡
          </div>
        ))}

        {/* Damage texts */}
        {ui.damageTexts.map((dt, i) => (
          <div key={`dt-${i}`} style={{ position: 'absolute', left: dt.x - 30, top: dt.y, width: 60, textAlign: 'center', fontSize: dt.size || 20, fontWeight: 'bold', color: dt.color, textShadow: dt.isCrit ? `0 0 20px ${dt.color}` : '2px 2px 0 #000', pointerEvents: 'none', zIndex: 15 }}>
            {dt.value > 0 ? `-${dt.value}` : `+${Math.abs(dt.value)}`}
          </div>
        ))}
      </div>

      {/* Bottom bar: skill info */}
      <div style={{ width: GAME_WIDTH, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', padding: '6px 16px', background: 'linear-gradient(0deg, #0f0f28 0%, #151530 100%)', borderTop: '2px solid #2a2a4a', fontSize: 9, color: '#8888aa', flex: 1, gap: 8 }}>
        <SkillBar char={p1Char} side="left" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={() => { setSelectPhase('p1'); setScreen('select'); }} style={{ padding: '10px 18px', background: 'rgba(50,50,70,0.8)', border: '1px solid #4a4a6a', borderRadius: 6, color: '#aaaacc', cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, whiteSpace: 'nowrap' }}>返回选择</button>
        </div>
        <SkillBar char={p2Char} side="right" />
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────
function Bar({ c, m, color, w, h, label }: { c: number; m: number; color: string; w: number; h: number; label: string }) {
  const pct = Math.max(0, (c / m) * 100);
  return (
    <div style={{ width: w, height: h + 10 }}>
      <div style={{ fontSize: 9, color: '#c8c8e0', marginBottom: 4, display: 'flex', justifyContent: 'space-between', textShadow: '1px 1px 0 #000' }}>
        <span>{label}</span>
        <span>{Math.round(c)}/{Math.round(m)}</span>
      </div>
      <div style={{ width: '100%', height: h, background: '#1e1e38', borderRadius: 6, overflow: 'hidden', border: '2px solid #3a3a5a', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(180deg, ${color}ee 0%, ${color}88 60%, ${color}44 100%)`, transition: 'width 0.15s ease-out', boxShadow: `0 0 12px ${color}`, borderRadius: '0 4px 4px 0' }} />
      </div>
    </div>
  );
}

function ComboText({ n }: { n: number }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#ffd700', textShadow: '0 0 10px #ffd700, 2px 2px 0 #000' }}>
      {n} COMBO!
    </div>
  );
}

function FighterDiv({ pos, stats, flip }: { pos: { x: number; y: number; facingRight: boolean }; stats: UISnapshot['p1Stats']; flip?: boolean }) {
  const dir = flip ? (pos.facingRight ? 'scaleX(-1)' : '') : (pos.facingRight ? '' : 'scaleX(-1)');
  return (
    <div style={{ position: 'absolute', left: pos.x - FIGHTER_WIDTH / 2, top: pos.y - FIGHTER_HEIGHT, width: FIGHTER_WIDTH, height: FIGHTER_HEIGHT, transform: dir, transition: 'left 0.05s, top 0.05s', filter: stats.hitFlash > 0 ? 'brightness(4) saturate(0)' : 'none', zIndex: 10 }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: stats.isShielded ? `radial-gradient(circle, ${stats.color}44 0%, transparent 70%)` : stats.isBlocking ? `radial-gradient(circle, ${stats.color}33 0%, transparent 60%)` : 'none', borderRadius: 8 }}>
        <div style={{ fontSize: 56, lineHeight: 1, transform: stats.isAttacking ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.08s', filter: `drop-shadow(0 0 ${stats.isShielded ? 20 : 10}px ${stats.color})` }}>
          {stats.sprite}
        </div>
        <div style={{ fontSize: 8, color: stats.color, marginTop: 4, textShadow: `0 0 8px ${stats.color}` }}>{stats.name}</div>
      </div>
      {stats.isShielded && <div style={{ position: 'absolute', inset: -15, border: `3px solid ${stats.color}`, borderRadius: 16, animation: 'pulse 0.8s ease-in-out infinite', boxShadow: `0 0 20px ${stats.color}` }} />}
      {stats.isBlocking && <div style={{ position: 'absolute', inset: -8, border: `2px solid ${stats.color}88`, borderRadius: 12, background: `${stats.color}11`, boxShadow: `0 0 12px ${stats.color}44`, animation: 'pulse 1s ease-in-out infinite' }} />}
      {stats.isStunned && <div style={{ position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', fontSize: 22, animation: 'shake 0.2s ease-in-out infinite' }}>⭐💫⭐</div>}
    </div>
  );
}

// ─── Type badge ────────────────────────────────────────────
const typeLabels: Record<string, string> = {
  melee: '近战', ranged: '远程', buff: '增益', heal: '治疗', debuff: '减益',
};
const typeColors: Record<string, string> = {
  melee: '#ff6b6b', ranged: '#3498db', buff: '#2ecc71', heal: '#1abc9c', debuff: '#9b59b6',
};

const skillKbdStyle: React.CSSProperties = {
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: 4,
  border: '1px solid rgba(255, 209, 92, 0.62)',
  background: 'rgba(255, 209, 92, 0.14)',
  color: '#fff2b8',
  fontFamily: 'inherit',
  fontSize: 8,
  lineHeight: 1,
  boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.45), 0 0 10px rgba(255,209,92,0.12)',
};

// ─── Skill info bar ────────────────────────────────────────
function SkillBar({ char, side }: { char: import('@/data/characters').Character | null; side: 'left' | 'right' }) {
  if (!char) return null;
  const keys = side === 'left' ? ['J', 'K', 'L', 'I'] : ['1', '2', '3', '0'];
  const skills = [
    { label: '普攻', key: keys[0], data: char.skills.attack },
    { label: '技能1', key: keys[1], data: char.skills.skill1 },
    { label: '技能2', key: keys[2], data: char.skills.skill2 },
    { label: '终极', key: keys[3], data: char.skills.ultimate },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 'bold', color: char.color, textAlign: side }}>
        {side === 'left' ? '👈 ' : ''}{char.name}{side === 'right' ? ' 👉' : ''}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: side === 'right' ? 'flex-end' : 'flex-start' }}>
        {skills.map((s) => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 6px', borderRadius: 4,
            background: `${typeColors[s.data.type]}15`,
            border: `1px solid ${typeColors[s.data.type]}44`,
            fontSize: 9, lineHeight: 1.3,
          }}>
            <kbd style={skillKbdStyle}>{s.key}</kbd>
            <span style={{ color: '#c8c8e0', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{s.label}</span>
            <span style={{
              fontSize: 8, padding: '1px 4px', borderRadius: 3,
              background: `${typeColors[s.data.type]}33`,
              color: typeColors[s.data.type], fontWeight: 'bold', whiteSpace: 'nowrap',
            }}>{typeLabels[s.data.type] || s.data.type}</span>
            <span style={{ color: '#8888aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
              {s.data.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
