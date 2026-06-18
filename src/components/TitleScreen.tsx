import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/gameStore';
import { getRoomIdFromUrl } from '@/net/roomUrl';

export default function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const { language, toggleLanguage, t } = useI18n();
  const copy = t.title;

  useEffect(() => {
    if (getRoomIdFromUrl()) {
      setScreen('online');
    }
  }, [setScreen]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, #091018 0%, #15172c 50%, #190e18 100%)',
        color: '#f6f8ff',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 78%)',
        }}
      />
      <div style={{ position: 'absolute', top: '12%', left: '12%', fontSize: 52, opacity: 0.1, animation: 'float 3s ease-in-out infinite' }}>OFFICE</div>
      <div style={{ position: 'absolute', bottom: '12%', right: '10%', fontSize: 44, opacity: 0.1, animation: 'float 4s ease-in-out infinite' }}>FIGHT</div>
      <button type="button" onClick={toggleLanguage} style={languageToggleStyle} aria-label={copy.languageAria}>
        {language === 'zh' ? 'CN / EN' : 'EN / CN'}
      </button>

      <main style={{ position: 'relative', textAlign: 'center', display: 'grid', gap: 30, justifyItems: 'center', width: 'min(860px, calc(100vw - 32px))' }}>
        <div className="animate-slide-up" style={{ display: 'grid', gap: 18 }}>
          <div style={{ fontSize: 12, color: '#7be7c7', letterSpacing: 2 }}>OFFICE FIGHTING CHAMPIONSHIP</div>
          <h1
            style={{
              fontSize: 'clamp(30px, 7vw, 66px)',
              color: '#ffd15c',
              textShadow: '0 0 18px rgba(255,209,92,0.55), 5px 5px 0 #111827',
              letterSpacing: 2,
            }}
          >
            {copy.title}
          </h1>
          <p style={{ color: '#93a4c2', fontSize: 12, lineHeight: 1.8 }}>
            {copy.subtitle}
          </p>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: 128,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(255,209,92,0.72), transparent)',
            boxShadow: '0 0 16px rgba(255,209,92,0.34)',
          }}
        />

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setScreen('select')} className="animate-pulse" style={localButton}>
            {copy.localBattle}
          </button>
          <button onClick={() => setScreen('online')} style={onlineButton}>
            {copy.onlineBattle}
          </button>
        </div>

        <div style={{ color: '#526079', fontSize: 10, lineHeight: 1.8 }}>
          {copy.controls}
        </div>
      </main>
    </div>
  );
}

const languageToggleStyle: React.CSSProperties = {
  position: 'absolute',
  top: 22,
  right: 22,
  minWidth: 86,
  height: 36,
  padding: '0 12px',
  borderRadius: 6,
  border: '1px solid rgba(123,231,199,0.45)',
  background: 'rgba(7, 16, 24, 0.76)',
  color: '#bfffee',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 10,
  boxShadow: '0 0 18px rgba(123,231,199,0.12)',
  zIndex: 2,
};

const baseButton: React.CSSProperties = {
  minWidth: 190,
  padding: '20px 34px',
  fontSize: 'clamp(12px, 2.5vw, 18px)',
  fontFamily: 'inherit',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
};

const localButton: React.CSSProperties = {
  ...baseButton,
  background: 'linear-gradient(180deg, #ff4757 0%, #c0392b 100%)',
  border: '4px solid #ff6b7a',
  color: '#fff',
  textShadow: '2px 2px 0 #1a1a2e',
  boxShadow: '0 6px 0 #8b0000, 0 8px 20px rgba(255, 71, 87, 0.5)',
};

const onlineButton: React.CSSProperties = {
  ...baseButton,
  background: 'linear-gradient(180deg, #7be7c7 0%, #168f72 100%)',
  border: '4px solid #a1ffe5',
  color: '#071018',
  boxShadow: '0 6px 0 #0b5f4c, 0 8px 20px rgba(123, 231, 199, 0.32)',
};
