import type { CSSProperties } from 'react';
import { useGameStore } from '@/store/gameStore';
import { characters, Character } from '@/data/characters';
import '@/styles/character-select.css';

const MAX_MOVE_SPEED = Math.max(...characters.map((char) => char.moveSpeed));

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={statRowStyle}>
      <span style={{ ...statLabelStyle, color }}>{label}</span>
      <span style={statValueStyle}>{value}</span>
    </div>
  );
}

function PlayerPreview({
  label,
  character,
  active,
  onClick,
}: {
  label: string;
  character: Character | null;
  active: boolean;
  onClick: () => void;
}) {
  const color = character?.color || '#5a5a7a';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...playerPreviewStyle,
        borderColor: active ? '#ffd700' : color,
        background: character
          ? `linear-gradient(180deg, ${character.color}30 0%, rgba(15,15,35,0.92) 100%)`
          : 'rgba(15, 15, 35, 0.86)',
        boxShadow: active ? '0 0 18px rgba(255,215,0,0.28)' : 'none',
        cursor: 'pointer',
      }}
    >
      <div style={previewLabelStyle}>
        {label}
        <span style={active ? previewActivePillStyle : previewEditPillStyle}>
          {active ? '编辑中' : '点击重选'}
        </span>
      </div>
      <div style={previewSpriteStyle}>{character?.sprite || '?'}</div>
      <div style={{ ...previewNameStyle, color }}>{character?.name || '未选择'}</div>
    </button>
  );
}

function CharacterCard({
  character,
  isSelected,
  onClick,
  disabled,
}: {
  character: Character;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...characterCardStyle,
        background: isSelected
          ? `linear-gradient(180deg, ${character.color}36 0%, rgba(15,15,35,0.92) 100%)`
          : 'rgba(20, 20, 40, 0.9)',
        borderColor: isSelected ? character.color : '#4a4a6a',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.42 : 1,
        boxShadow: isSelected ? `0 0 24px ${character.color}66` : '0 12px 28px rgba(0,0,0,0.18)',
        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={cardSpriteStyle}>{character.sprite}</div>
      <div style={{ ...cardNameStyle, color: character.color }}>{character.name}</div>
      <div style={cardTitleStyle}>{character.title}</div>

      <div style={statListStyle}>
        <StatRow label="HP" value={character.maxHp} color="#ff6474" />
        <StatRow label="MP" value={character.maxMp} color="#5bb8ff" />
        <StatRow label="攻速" value={character.attackSpeed} color="#ffe066" />
        <StatRow label="移速" value={character.moveSpeed} color="#65f0c4" />
      </div>
    </button>
  );
}

function SkillDisplay({ character }: { character: Character }) {
  const moveRatio = Math.max(0, Math.min(1, character.moveSpeed / MAX_MOVE_SPEED));
  const skills = [
    { key: 'attack', color: '#aaaacc' },
    { key: 'skill1', color: '#3498db' },
    { key: 'skill2', color: '#9b59b6' },
    { key: 'ultimate', color: '#ffd700' },
  ];

  return (
    <div style={skillPanelStyle}>
      <div style={sectionTitleStyle}>技能预览</div>
      <div style={profileStatPanelStyle}>
        <div style={profileStatHeaderStyle}>
          <span>移动速度</span>
          <strong style={{ color: '#65f0c4' }}>{character.moveSpeed}</strong>
        </div>
        <div style={speedTrackStyle}>
          <div
            style={{
              ...speedFillStyle,
              width: `${moveRatio * 100}%`,
              background: `linear-gradient(90deg, #65f0c4 0%, ${character.color} 100%)`,
            }}
          />
        </div>
        <div style={profileHintStyle}>{getSpeedLabel(character.moveSpeed)}</div>
      </div>
      <div style={skillListStyle}>
        {skills.map((s) => {
          const skill = character.skills[s.key as keyof typeof character.skills];
          return (
            <div
              key={s.key}
              style={{
                ...skillItemStyle,
                background: `${s.color}12`,
                borderLeftColor: s.color,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: s.color, marginBottom: '5px' }}>{skill.name}</div>
                <div style={skillDescriptionStyle}>{skill.description}</div>
              </div>
              <div style={skillMetaStyle}>
                <div>伤害: {skill.damage || '-'}</div>
                <div>耗蓝: {skill.mpCost}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getSpeedLabel(speed: number) {
  if (speed <= 2.5) return '重装慢速，适合靠技能压制';
  if (speed >= 5.5) return '高机动，适合拉扯和追击';
  if (speed >= 4.8) return '偏快，走位空间更大';
  return '标准移速，攻防节奏均衡';
}

export default function CharacterSelect() {
  const {
    setScreen,
    setSelectPhase,
    setPlayer1Character,
    setPlayer2Character,
    clearSelections,
    player1Character,
    player2Character,
    selectPhase,
    initBattle,
  } = useGameStore();

  const handleSelect = (char: Character) => {
    if (selectPhase === 'p1') {
      setPlayer1Character(char);
    } else {
      setPlayer2Character(char);
    }
  };

  const activeCharacter = selectPhase === 'p1' ? player1Character : player2Character;
  const canConfirm = player1Character && player2Character;

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>选择你的战士</h1>
        <p style={subtitleStyle}>
          {selectPhase === 'p1' ? '👉 玩家1 请选择角色' : '👉 玩家2 请选择角色'}
        </p>
      </header>

      <main style={mainGridStyle} className="character-select-main">
        <section style={leftColumnStyle} className="character-select-left">
          <div style={duelPreviewStyle} className="character-select-duel">
            <PlayerPreview label="玩家1" character={player1Character} active={selectPhase === 'p1'} onClick={() => setSelectPhase('p1')} />
            <div style={vsStyle}>VS</div>
            <PlayerPreview label="玩家2" character={player2Character} active={selectPhase === 'p2'} onClick={() => setSelectPhase('p2')} />
          </div>

          <div style={rosterPanelStyle} className="character-select-roster">
            <div style={sectionTitleStyle}>角色列表</div>
            <div style={characterGridStyle} className="character-select-grid">
              {characters.map((char) => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isSelected={
                    (selectPhase === 'p1' && player1Character?.id === char.id) ||
                    (selectPhase === 'p2' && player2Character?.id === char.id)
                  }
                  onClick={() => handleSelect(char)}
                  disabled={
                    (selectPhase === 'p1' && player2Character?.id === char.id) ||
                    (selectPhase === 'p2' && player1Character?.id === char.id)
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <aside style={rightPanelStyle} className="character-select-aside">
          {activeCharacter ? (
            <SkillDisplay character={activeCharacter} />
          ) : (
            <div style={emptySkillStyle}>等待选择角色</div>
          )}

          <div style={actionsStyle}>
            <button onClick={() => setScreen('title')} style={ghostButtonStyle}>
              返回
            </button>

            {(player1Character || player2Character) && (
              <button onClick={clearSelections} style={secondaryButtonStyle}>
                清空选择
              </button>
            )}

            {selectPhase === 'p1' && player1Character && (
              <button onClick={() => setSelectPhase('p2')} style={confirmButtonStyle}>
                玩家2选择
              </button>
            )}

            {selectPhase === 'p2' && (
              <button onClick={() => setSelectPhase('p1')} style={secondaryButtonStyle}>
                重新选择玩家1
              </button>
            )}

            {selectPhase === 'p2' && canConfirm && (
              <button onClick={initBattle} className="animate-pulse" style={startButtonStyle}>
                开始战斗
              </button>
            )}

            {selectPhase === 'p2' && !canConfirm && <div style={waitingStyle}>等待玩家2选择角色...</div>}
          </div>
        </aside>
      </main>
    </div>
  );
}

const pageStyle: CSSProperties = {
  width: '100vw',
  height: '100vh',
  overflow: 'auto',
  background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
  padding: '18px 24px 22px',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: '14px',
};

const headerStyle: CSSProperties = {
  textAlign: 'center',
};

const titleStyle: CSSProperties = {
  fontSize: '24px',
  color: '#ffd700',
  textShadow: '0 0 10px #ffd700',
};

const subtitleStyle: CSSProperties = {
  fontSize: '12px',
  color: '#aaaacc',
  marginTop: '8px',
};

const mainGridStyle: CSSProperties = {
  width: 'min(1240px, calc(100vw - 48px))',
  minHeight: 0,
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(310px, 360px)',
  gap: '22px',
  alignItems: 'stretch',
};

const leftColumnStyle: CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: '126px minmax(0, 1fr)',
  gap: '16px',
};

const duelPreviewStyle: CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(150px, 1fr) auto minmax(150px, 1fr)',
  alignItems: 'center',
  gap: '24px',
};

const playerPreviewStyle: CSSProperties = {
  height: '118px',
  padding: '14px 18px',
  border: '3px solid',
  borderRadius: '12px',
  textAlign: 'center',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  alignItems: 'center',
  color: '#eef2ff',
  fontFamily: 'inherit',
  transition: 'transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease',
};

const previewLabelStyle: CSSProperties = {
  color: '#cbd5ff',
  fontSize: '10px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  minWidth: 0,
};

const previewActivePillStyle: CSSProperties = {
  padding: '2px 6px',
  borderRadius: '999px',
  background: 'rgba(255,215,0,0.18)',
  border: '1px solid rgba(255,215,0,0.34)',
  color: '#ffe680',
  fontSize: '8px',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
};

const previewEditPillStyle: CSSProperties = {
  ...previewActivePillStyle,
  background: 'rgba(148,163,184,0.12)',
  border: '1px solid rgba(148,163,184,0.22)',
  color: '#b8c3df',
};

const previewSpriteStyle: CSSProperties = {
  fontSize: '34px',
  lineHeight: 1,
};

const previewNameStyle: CSSProperties = {
  fontSize: '10px',
  lineHeight: 1.4,
};

const vsStyle: CSSProperties = {
  color: '#ffd700',
  fontSize: '46px',
  lineHeight: 1,
  textShadow: '4px 4px 0 #1a1a2e',
};

const rosterPanelStyle: CSSProperties = {
  minHeight: 0,
  padding: '16px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  background: 'rgba(12, 12, 30, 0.48)',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: '12px',
};

const sectionTitleStyle: CSSProperties = {
  color: '#aaaacc',
  fontSize: '10px',
};

const characterGridStyle: CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(162px, 1fr))',
  gridAutoRows: '210px',
  gap: '14px',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '4px 4px 8px',
};

const characterCardStyle: CSSProperties = {
  width: '100%',
  height: '210px',
  padding: '13px 14px',
  border: '3px solid',
  borderRadius: '12px',
  color: '#f8fafc',
  transition: 'transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
  display: 'grid',
  gridTemplateRows: '48px auto auto 1fr',
  alignItems: 'center',
  justifyItems: 'stretch',
  overflow: 'hidden',
  fontFamily: 'inherit',
};

const cardSpriteStyle: CSSProperties = {
  fontSize: '42px',
  lineHeight: 1,
  textAlign: 'center',
};

const cardNameStyle: CSSProperties = {
  fontSize: '12px',
  textAlign: 'center',
  fontWeight: 'bold',
  lineHeight: 1.4,
};

const cardTitleStyle: CSSProperties = {
  fontSize: '8px',
  color: '#aaaacc',
  textAlign: 'center',
  lineHeight: 1.5,
};

const statListStyle: CSSProperties = {
  alignSelf: 'end',
  display: 'grid',
  gap: '5px',
  fontSize: '9px',
};

const statRowStyle: CSSProperties = {
  minHeight: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
};

const statLabelStyle: CSSProperties = {
  minWidth: '34px',
  fontWeight: 'bold',
  textAlign: 'left',
  textShadow: '0 1px 2px rgba(0,0,0,0.9)',
};

const statValueStyle: CSSProperties = {
  minWidth: '42px',
  padding: '3px 6px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(4, 8, 18, 0.72)',
  color: '#ffffff',
  textAlign: 'right',
  fontWeight: 'bold',
  lineHeight: 1,
  textShadow: '0 1px 2px rgba(0,0,0,0.85)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
};

const rightPanelStyle: CSSProperties = {
  minHeight: 0,
  padding: '18px',
  border: '2px solid #4a4a6a',
  borderRadius: '10px',
  background: 'rgba(20, 20, 40, 0.86)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const skillPanelStyle: CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: 'auto auto minmax(0, 1fr)',
  gap: '12px',
};

const profileStatPanelStyle: CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(101,240,196,0.26)',
  background: 'rgba(7, 16, 28, 0.64)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
};

const profileStatHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#d8def5',
  fontSize: '10px',
  marginBottom: '8px',
};

const speedTrackStyle: CSSProperties = {
  height: '8px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.1)',
  overflow: 'hidden',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
};

const speedFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: '999px',
  transition: 'width 0.2s ease',
};

const profileHintStyle: CSSProperties = {
  marginTop: '8px',
  color: '#8da0c8',
  fontSize: '8px',
  lineHeight: 1.5,
};

const skillListStyle: CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gap: '10px',
};

const skillItemStyle: CSSProperties = {
  minHeight: '64px',
  padding: '10px',
  borderRadius: '6px',
  borderLeft: '3px solid',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '12px',
};

const skillDescriptionStyle: CSSProperties = {
  fontSize: '8px',
  color: '#7c86a6',
  lineHeight: 1.5,
};

const skillMetaStyle: CSSProperties = {
  fontSize: '8px',
  color: '#d8def5',
  lineHeight: 1.7,
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

const emptySkillStyle: CSSProperties = {
  minHeight: '180px',
  display: 'grid',
  placeItems: 'center',
  border: '1px dashed rgba(255,255,255,0.16)',
  borderRadius: '8px',
  color: '#6f7898',
  fontSize: '10px',
};

const actionsStyle: CSSProperties = {
  marginTop: 'auto',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '12px',
};

const baseActionButtonStyle: CSSProperties = {
  minHeight: '52px',
  padding: '0 20px',
  borderRadius: '8px',
  fontSize: '12px',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const ghostButtonStyle: CSSProperties = {
  ...baseActionButtonStyle,
  background: 'rgba(60, 60, 80, 0.8)',
  border: '2px solid #4a4a6a',
  color: '#d4daf2',
};

const confirmButtonStyle: CSSProperties = {
  ...baseActionButtonStyle,
  background: 'linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%)',
  border: '2px solid #66BB6A',
  color: '#fff',
};

const secondaryButtonStyle: CSSProperties = {
  ...baseActionButtonStyle,
  minHeight: '46px',
  background: 'rgba(18, 29, 52, 0.9)',
  border: '1px solid rgba(148,163,184,0.28)',
  color: '#c9d4f0',
};

const startButtonStyle: CSSProperties = {
  ...baseActionButtonStyle,
  background: 'linear-gradient(180deg, #ff4757 0%, #c0392b 100%)',
  border: '3px solid #ff6b7a',
  color: '#fff',
  boxShadow: '0 0 20px rgba(255, 71, 87, 0.5)',
};

const waitingStyle: CSSProperties = {
  minHeight: '52px',
  display: 'grid',
  placeItems: 'center',
  color: '#ff6b7a',
  fontSize: '10px',
  textAlign: 'center',
};
