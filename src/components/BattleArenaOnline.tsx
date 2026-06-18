import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Wifi } from 'lucide-react';
import { characters, Character, Skill } from '@/data/characters';
import { getProjectileIcon } from '@/data/projectileVisuals';
import { getLocalizedSkillEventName, getSkillName, getSkillSlotByIndex } from '@/data/skillText';
import { getCharacterName, useI18n } from '@/i18n';
import { GAME_HEIGHT, GAME_WIDTH, FIGHTER_HEIGHT, FIGHTER_WIDTH, HP_BAR_HEIGHT, HP_BAR_WIDTH, MP_BAR_HEIGHT, MP_BAR_WIDTH } from '@/game/constants';
import { GameEvent, PlayerInput, PlayerSlot } from '@/net/protocol';
import { useOnlineRoom } from '@/net/useOnlineRoom';
import { useGameStore } from '@/store/gameStore';
import { useOnlineStore } from '@/store/onlineStore';
import { useSettingsStore } from '@/store/settingsStore';

const characterMap = new Map(characters.map((character) => [character.id, character]));

type OnlineVisualEffect = {
  id: string;
  kind: 'skill' | 'number' | 'burst';
  x: number;
  y: number;
  color: string;
  createdAt: number;
  text?: string;
  value?: number;
  crit?: boolean;
  healing?: boolean;
  variant?: 'hit' | 'skill' | 'buff' | 'heal' | 'ultimate';
};

export default function BattleArenaOnline() {
  const { t } = useI18n();
  const setScreen = useGameStore((s) => s.setScreen);
  const { sendInput, leaveRoom } = useOnlineRoom();
  const { snapshot, mySlot, roomId, connected, winner, roomState, battleStart, events, pingMs } = useOnlineStore();
  const language = useSettingsStore((s) => s.language);
  const keysRef = useRef<Set<string>>(new Set());
  const seqRef = useRef(0);
  const processedEventKeysRef = useRef<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [visualEffects, setVisualEffects] = useState<OnlineVisualEffect[]>([]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keysRef.current.add(event.code);
      event.preventDefault();
    };
    const up = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
      event.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    if (!mySlot || !roomId) return;
    const timer = setInterval(() => {
      sendInput(buildInput(keysRef.current, mySlot, seqRef.current++));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [mySlot, roomId, sendInput]);

  useEffect(() => {
    keysRef.current.clear();
    seqRef.current = 0;
    processedEventKeysRef.current.clear();
    setVisualEffects([]);
  }, [battleStart?.startedAt]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const p1Char = useMemo(() => (snapshot ? characterMap.get(snapshot.p1.characterId) : null), [snapshot]);
  const p2Char = useMemo(() => (snapshot ? characterMap.get(snapshot.p2.characterId) : null), [snapshot]);
  const winnerChar = winner === 1 ? p1Char : winner === 2 ? p2Char : null;

  useEffect(() => {
    if (!snapshot) return;
    const freshEffects: OnlineVisualEffect[] = [];
    for (const event of events) {
      const key = eventKey(event);
      if (processedEventKeysRef.current.has(key)) continue;
      processedEventKeysRef.current.add(key);
      freshEffects.push(...buildVisualEffects(event, snapshot, p1Char, p2Char, language, t.onlineBattle.victory));
    }
    if (freshEffects.length > 0) {
      setVisualEffects((current) => [...current, ...freshEffects].slice(-36));
    }
  }, [events, language, p1Char, p2Char, snapshot]);

  useEffect(() => {
    const timer = setInterval(() => {
      const cutoff = Date.now() - 1250;
      setVisualEffects((current) => current.filter((effect) => effect.createdAt >= cutoff));
    }, 180);
    return () => clearInterval(timer);
  }, []);

  const countdown = roomState?.status === 'countdown' && roomState.countdownEndsAt
    ? Math.max(0, Math.ceil((roomState.countdownEndsAt - now) / 1000))
    : null;

  if (!snapshot) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a1a', color: '#f5f7fb' }}>
        <div style={{ textAlign: 'center', display: 'grid', gap: 18 }}>
          <div style={{ fontSize: 18, color: '#ffd15c' }}>{winner ? t.onlineBattle.playerWins(winner) : countdown ? t.onlineBattle.battleCountdown(countdown) : t.onlineBattle.waitingSnapshot}</div>
          <div style={{ fontSize: 10, color: '#8492ad' }}>{t.common.room} {roomId || '-'} · {connected ? t.common.online : t.common.offline}</div>
          <button
            onClick={() => {
              setScreen('online');
            }}
            style={ghostButton}
          >
            {t.onlineBattle.backToLobby}
          </button>
        </div>
      </div>
    );
  }

  const p1 = snapshot.p1;
  const p2 = snapshot.p2;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#080b14', overflow: 'hidden', color: '#fff' }}>
      <div style={{ width: GAME_WIDTH, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 24px', background: 'linear-gradient(180deg, #111827 0%, #121426 100%)', borderBottom: '2px solid #26324a', zIndex: 5 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '40%', gap: 4 }}>
          <Bar c={p1.hp} m={p1.maxHp} color="#ff4757" w={HP_BAR_WIDTH} h={HP_BAR_HEIGHT} label="HP" />
          <Bar c={p1.mp} m={p1.maxMp} color="#3498db" w={MP_BAR_WIDTH} h={MP_BAR_HEIGHT} label="MP" />
          {p1.combo >= 2 && <ComboText n={p1.combo} />}
        </div>
        <div style={{ textAlign: 'center', display: 'grid', gap: 7 }}>
          <div style={{ fontSize: 22, color: '#ffd15c', textShadow: '0 0 15px rgba(255,209,92,0.6)', fontWeight: 'bold' }}>{t.onlineBattle.onlineVs}</div>
          <div style={{ fontSize: 9, color: connected ? '#7be7c7' : '#ff6b7a', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={12} /> {roomId} · P{mySlot} · {t.onlineBattle.ping(pingMs)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '40%', gap: 4 }}>
          <Bar c={p2.hp} m={p2.maxHp} color="#ff4757" w={HP_BAR_WIDTH} h={HP_BAR_HEIGHT} label="HP" />
          <Bar c={p2.mp} m={p2.maxMp} color="#3498db" w={MP_BAR_WIDTH} h={MP_BAR_HEIGHT} label="MP" />
          {p2.combo >= 2 && <ComboText n={p2.combo} />}
        </div>
      </div>

      <div style={{ width: GAME_WIDTH, height: GAME_HEIGHT - 100, margin: '0 auto', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #080d1a 0%, #171b31 55%, #101420 100%)' }}>
        <ArenaBackground />
        {snapshot.projectiles.map((projectile) => (
          <div key={projectile.id} className="online-projectile" style={{ position: 'absolute', left: projectile.x - 20, top: projectile.y - 18, color: projectile.trailColor, zIndex: 9 }}>
            {getProjectileIcon(projectile.type)}
          </div>
        ))}
        <FighterDiv fighter={p1} char={p1Char} />
        <FighterDiv fighter={p2} char={p2Char} flip />
        {visualEffects.map((effect) => {
          if (effect.kind === 'skill') {
            return (
              <div
                key={effect.id}
                className={`online-skill-popup ${effect.variant === 'ultimate' ? 'online-skill-popup-ultimate' : ''}`}
                style={{ left: effect.x - 110, top: effect.y, color: effect.color, textShadow: `0 0 18px ${effect.color}` }}
              >
                {effect.text}
              </div>
            );
          }
          if (effect.kind === 'number') {
            return (
              <div
                key={effect.id}
                className={`online-damage-text ${effect.crit ? 'online-damage-text-crit' : ''}`}
                style={{ left: effect.x - 34, top: effect.y - 26, color: effect.color, textShadow: effect.crit ? `0 0 22px ${effect.color}` : '2px 2px 0 #000' }}
              >
                {effect.healing ? `+${effect.value}` : `-${effect.value}`}
              </div>
            );
          }
          return (
            <div
              key={effect.id}
              className={`online-burst online-burst-${effect.variant || 'skill'}`}
              style={{ left: effect.x - 31, top: effect.y - 31, color: effect.color, borderColor: effect.color, boxShadow: `0 0 24px ${effect.color}` }}
            />
          );
        })}
        {winner && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', zIndex: 30 }}>
            <div style={{ minWidth: 340, padding: 30, border: `1px solid ${winnerChar?.color || '#ffd15c'}88`, background: 'rgba(8,12,22,0.92)', borderRadius: 8, textAlign: 'center', display: 'grid', gap: 16, boxShadow: `0 0 48px ${winnerChar?.color || '#ffd15c'}33` }}>
              <div style={{ fontSize: 12, color: '#7be7c7', letterSpacing: 2 }}>{t.onlineBattle.battleResult}</div>
              <div style={{ fontSize: 30, color: winnerChar?.color || '#ffd15c', textShadow: `0 0 22px ${winnerChar?.color || '#ffd15c'}` }}>{t.onlineBattle.playerWins(winner)}</div>
              <div style={{ fontSize: 52, filter: `drop-shadow(0 0 20px ${winnerChar?.color || '#ffd15c'})` }}>{winnerChar?.sprite || '★'}</div>
              <div style={{ fontSize: 11, color: '#dfe7f7' }}>{t.onlineBattle.winnerLine(getCharacterName(winnerChar, language) || t.characterSelect.playerLabel(winner))}</div>
              <button
                onClick={() => {
                  setScreen('online');
                }}
                style={primaryButton}
              >
                {t.onlineBattle.backToLobby}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ width: GAME_WIDTH, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center', padding: '10px 16px', background: '#101426', borderTop: '2px solid #26324a', flex: 1 }}>
        <SkillHints char={p1Char} slot={1} align="left" active={mySlot === 1} language={language} />
        <button
          onClick={() => {
            leaveRoom();
            setScreen('online');
          }}
          style={ghostButton}
        >
          <ArrowLeft size={14} />
          {t.onlineBattle.leave}
        </button>
        <SkillHints char={p2Char} slot={2} align="right" active={mySlot === 2} language={language} />
      </div>
    </div>
  );
}

function buildInput(keys: Set<string>, slot: 1 | 2, seq: number): PlayerInput {
  const p1Keys = slot === 1;
  return {
    seq,
    clientTime: performance.now(),
    left: keys.has(p1Keys ? 'KeyA' : 'ArrowLeft'),
    right: keys.has(p1Keys ? 'KeyD' : 'ArrowRight'),
    jump: keys.has(p1Keys ? 'KeyW' : 'ArrowUp'),
    attack: keys.has(p1Keys ? 'KeyJ' : 'Digit1'),
    skill1: keys.has(p1Keys ? 'KeyK' : 'Digit2'),
    skill2: keys.has(p1Keys ? 'KeyL' : 'Digit3'),
    ultimate: keys.has(p1Keys ? 'KeyI' : 'Digit0'),
  };
}

function eventKey(event: GameEvent) {
  if (event.type === 'hit') return `${event.type}:${event.frame}:${event.target}:${event.damage}:${Math.round(event.x)}:${Math.round(event.y)}`;
  if (event.type === 'skill') return `${event.type}:${event.frame}:${event.owner}:${event.skillIndex}:${event.skillName}`;
  return `${event.type}:${event.frame}:${event.winner}`;
}

function buildVisualEffects(
  event: GameEvent,
  snapshot: NonNullable<ReturnType<typeof useOnlineStore.getState>['snapshot']>,
  p1Char: Character | null | undefined,
  p2Char: Character | null | undefined,
  language: 'zh' | 'en',
  victoryText: string
): OnlineVisualEffect[] {
  const createdAt = Date.now();
  if (event.type === 'hit') {
    const color = event.crit ? '#ffd15c' : '#ff6b7a';
    return [
      {
        id: `hit-${event.frame}-${event.target}-${event.damage}-${createdAt}`,
        kind: 'number',
        x: event.x,
        y: event.y,
        color,
        createdAt,
        value: event.damage,
        crit: event.crit,
      },
      {
        id: `burst-hit-${event.frame}-${event.target}-${createdAt}`,
        kind: 'burst',
        x: event.x,
        y: event.y,
        color,
        createdAt,
        variant: 'hit',
      },
    ];
  }

  if (event.type === 'skill') {
    const fighter = event.owner === 1 ? snapshot.p1 : snapshot.p2;
    const char = event.owner === 1 ? p1Char : p2Char;
    const skill = getSkillByIndex(char, event.skillIndex);
    const color = char?.color || '#ffd15c';
    const variant = event.skillIndex === 2 ? 'ultimate' : skill?.type === 'heal' ? 'heal' : skill?.type === 'buff' ? 'buff' : 'skill';
    const effects: OnlineVisualEffect[] = [
      {
        id: `skill-${event.frame}-${event.owner}-${event.skillIndex}-${createdAt}`,
        kind: 'skill',
        x: fighter.x,
        y: fighter.y - FIGHTER_HEIGHT - 22,
        color,
        createdAt,
        text: getLocalizedSkillEventName(char, event.skillIndex, event.skillName, language),
        variant,
      },
      {
        id: `burst-skill-${event.frame}-${event.owner}-${event.skillIndex}-${createdAt}`,
        kind: 'burst',
        x: fighter.x,
        y: fighter.y - 58,
        color,
        createdAt,
        variant,
      },
    ];

    if (skill?.type === 'heal') {
      effects.push({
        id: `heal-${event.frame}-${event.owner}-${createdAt}`,
        kind: 'number',
        x: fighter.x,
        y: fighter.y - FIGHTER_HEIGHT + 6,
        color: '#7be7c7',
        createdAt,
        value: 30,
        healing: true,
      });
    }
    return effects;
  }

  const winnerFighter = event.winner === 1 ? snapshot.p1 : snapshot.p2;
  const winnerChar = event.winner === 1 ? p1Char : p2Char;
  return [
    {
      id: `game-over-${event.frame}-${event.winner}-${createdAt}`,
      kind: 'skill',
      x: winnerFighter.x,
      y: winnerFighter.y - FIGHTER_HEIGHT - 28,
      color: winnerChar?.color || '#ffd15c',
      createdAt,
      text: victoryText,
      variant: 'ultimate',
    },
  ];
}

function getSkillByIndex(char: Character | null | undefined, index: number) {
  if (!char) return null;
  return char.skills[getSkillSlotByIndex(index)];
}

function ArenaBackground() {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 126, background: 'linear-gradient(180deg, #20263c 0%, #111522 100%)', borderTop: '2px solid #3c4764' }} />
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} style={{ position: 'absolute', left: index * 88 + 16, bottom: 92, width: 52 + (index % 3) * 16, height: 88 + (index % 4) * 28, background: '#0d1322', border: '1px solid #1e2a42' }} />
      ))}
    </>
  );
}

function FighterDiv({ fighter, char, flip }: { fighter: { x: number; y: number; facingRight: boolean; hitFlash: number; isShielded: boolean; isBlocking: boolean; isAttacking: boolean; isStunned: boolean }; char: Character | null | undefined; flip?: boolean }) {
  const { language, t } = useI18n();
  const dir = flip ? (fighter.facingRight ? 'scaleX(-1)' : '') : fighter.facingRight ? '' : 'scaleX(-1)';
  const color = char?.color || '#7be7c7';
  return (
    <div style={{ position: 'absolute', left: fighter.x - FIGHTER_WIDTH / 2, top: fighter.y - FIGHTER_HEIGHT, width: FIGHTER_WIDTH, height: FIGHTER_HEIGHT, transform: dir, transition: 'left 0.04s linear, top 0.04s linear', filter: fighter.hitFlash > 0 ? 'brightness(4) saturate(0)' : 'none', zIndex: 12 }}>
      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: fighter.isShielded ? `radial-gradient(circle, ${color}44 0%, transparent 72%)` : fighter.isBlocking ? `radial-gradient(circle, ${color}33 0%, transparent 60%)` : 'none', borderRadius: 8 }}>
        <div style={{ fontSize: 56, transform: fighter.isAttacking ? 'scale(1.16)' : 'scale(1)', transition: 'transform 0.08s', filter: `drop-shadow(0 0 14px ${color})` }}>{char?.sprite || '?'}</div>
        <div style={{ fontSize: 8, color, textShadow: `0 0 8px ${color}` }}>{getCharacterName(char, language) || t.common.unknown}</div>
      </div>
      {fighter.isStunned && <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>{t.onlineBattle.stun}</div>}
    </div>
  );
}

function Bar({ c, m, color, w, h, label }: { c: number; m: number; color: string; w: number; h: number; label: string }) {
  const pct = Math.max(0, (c / m) * 100);
  return (
    <div style={{ width: w, height: h + 10 }}>
      <div style={{ fontSize: 9, color: '#c8d3e8', marginBottom: 4, display: 'flex', justifyContent: 'space-between', textShadow: '1px 1px 0 #000' }}>
        <span>{label}</span>
        <span>{Math.round(c)}/{Math.round(m)}</span>
      </div>
      <div style={{ width: '100%', height: h, background: '#1e263a', borderRadius: 6, overflow: 'hidden', border: '2px solid #36425d' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(180deg, ${color}ee 0%, ${color}88 100%)`, transition: 'width 0.12s linear', boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
}

function ComboText({ n }: { n: number }) {
  return <div style={{ fontSize: 13, fontWeight: 'bold', color: '#ffd15c', textShadow: '0 0 10px rgba(255,209,92,0.8), 2px 2px 0 #000' }}>{n} COMBO!</div>;
}

function SkillHints({ char, slot, align, active, language }: { char: Character | null | undefined; slot: PlayerSlot; align: 'left' | 'right'; active: boolean; language: 'zh' | 'en' }) {
  const { t } = useI18n();
  if (!char) return <div />;
  const keyMap: [string, keyof Character['skills'], Skill][] = slot === 1
    ? [
        ['J', 'attack', char.skills.attack],
        ['K', 'skill1', char.skills.skill1],
        ['L', 'skill2', char.skills.skill2],
        ['I', 'ultimate', char.skills.ultimate],
      ]
    : [
        ['1', 'attack', char.skills.attack],
        ['2', 'skill1', char.skills.skill1],
        ['3', 'skill2', char.skills.skill2],
        ['0', 'ultimate', char.skills.ultimate],
      ];
  return (
    <div style={{ textAlign: align, display: 'grid', gap: 6, fontSize: 9, color: '#8e9bb5', minWidth: 0 }}>
      <div style={{ color: char.color, fontSize: 10, display: 'flex', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 8 }}>
        {align === 'left' && active && <span style={activeBadgeStyle}>{t.onlineBattle.myKeys}</span>}
        <span>{getCharacterName(char, language)}</span>
        {align === 'right' && active && <span style={activeBadgeStyle}>{t.onlineBattle.myKeys}</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {keyMap.map(([key, skillSlot, skill]) => (
          <div key={key} style={skillKeyStyle}>
            <kbd style={kbdStyle}>{key}</kbd>
            <span style={{ color: '#d8e2f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 96 }}>{getSkillName(char, skillSlot, language) || skill.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const primaryButton: React.CSSProperties = {
  height: 42,
  padding: '0 18px',
  borderRadius: 6,
  border: '1px solid rgba(123,231,199,0.55)',
  background: 'linear-gradient(180deg, rgba(123,231,199,0.24), rgba(22,145,113,0.28))',
  color: '#ddfff6',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 10,
};

const ghostButton: React.CSSProperties = {
  minWidth: 90,
  height: 38,
  padding: '0 14px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.04)',
  color: '#b8c5da',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 10,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
};

const activeBadgeStyle: React.CSSProperties = {
  padding: '2px 5px',
  borderRadius: 4,
  border: '1px solid rgba(123,231,199,0.45)',
  background: 'rgba(123,231,199,0.12)',
  color: '#bfffee',
  fontSize: 8,
  whiteSpace: 'nowrap',
};

const skillKeyStyle: React.CSSProperties = {
  minHeight: 24,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '3px 6px',
  borderRadius: 5,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.045)',
  minWidth: 0,
};

const kbdStyle: React.CSSProperties = {
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: 4,
  border: '1px solid rgba(255,209,92,0.58)',
  background: 'rgba(255,209,92,0.14)',
  color: '#fff2b8',
  fontFamily: 'inherit',
  fontSize: 8,
  lineHeight: 1,
  boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.35)',
};
