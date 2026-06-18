import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, Plug, RadioTower, Swords, UserCheck, WifiOff } from 'lucide-react';
import { characters } from '@/data/characters';
import { getCharacterName, getCharacterTitle, getOnlineErrorText, useI18n } from '@/i18n';
import { getRoomIdFromUrl, isInviteJoinUrl } from '@/net/roomUrl';
import { getSocketServerUrl } from '@/net/socketClient';
import { useOnlineRoom } from '@/net/useOnlineRoom';
import { useOnlineStore } from '@/store/onlineStore';
import { useGameStore } from '@/store/gameStore';

export default function OnlineLobby() {
  const { language, t } = useI18n();
  const [nickname, setNickname] = useState(() => `Player${Math.floor(Math.random() * 900 + 100)}`);
  const [joinCode, setJoinCode] = useState(() => getRoomIdFromUrl() || '');
  const [openedFromInvite] = useState(() => isInviteJoinUrl());
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { createRoom, joinRoom, selectCharacter, setReady, leaveRoom } = useOnlineRoom();
  const socketServerUrl = getSocketServerUrl() || 'not configured';
  const setScreen = useGameStore((s) => s.setScreen);
  const { connected, roomId, inviteUrl, mySlot, roomState, error } = useOnlineStore();

  useEffect(() => {
    const roomFromUrl = getRoomIdFromUrl();
    if (roomFromUrl && !roomId) {
      setJoinCode(roomFromUrl);
    }
  }, [roomId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const me = useMemo(() => roomState?.players.find((player) => player.slot === mySlot) || null, [mySlot, roomState]);
  const opponent = useMemo(() => roomState?.players.find((player) => player.slot !== mySlot) || null, [mySlot, roomState]);

  const countdown = roomState?.status === 'countdown' && roomState.countdownEndsAt
    ? Math.max(0, Math.ceil((roomState.countdownEndsAt - now) / 1000))
    : null;
  const canEditLobby = roomState?.status === 'lobby' || roomState?.status === 'ended';

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #081016 0%, #111627 45%, #160d16 100%)',
        color: '#f5f7fb',
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 75%)',
        }}
      />

      <main style={{ position: 'relative', width: 'min(1120px, calc(100vw - 32px))', height: '100%', margin: '0 auto', padding: '32px 0', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#7be7c7', letterSpacing: 1.5, marginBottom: 10 }}>{t.onlineLobby.eyebrow}</div>
            <h1 style={{ fontSize: 28, color: '#ffd15c', textShadow: '0 0 22px rgba(255, 209, 92, 0.45)' }}>{t.onlineLobby.title}</h1>
          </div>
          <button
            onClick={() => {
              leaveRoom();
              setScreen('title');
            }}
            style={ghostButton}
          >
            {t.common.backHome}
          </button>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: roomId ? '360px 1fr' : '1fr 1fr', gap: 18, minHeight: 0 }}>
          <div style={panelStyle}>
            <div style={panelTitleStyle}>
              {connected ? <RadioTower size={18} /> : <WifiOff size={18} />}
              <span>{connected ? t.onlineLobby.connected : t.onlineLobby.connecting}</span>
            </div>
            {!roomId ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <label style={labelStyle}>
                  {t.onlineLobby.nickname}
                  <input value={nickname} onChange={(event) => setNickname(event.target.value)} style={inputStyle} maxLength={24} />
                </label>
                <button onClick={() => createRoom(nickname)} disabled={!connected} style={primaryButton}>
                  <Plug size={18} />
                  {t.onlineLobby.createRoom}
                </button>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
                <label style={labelStyle}>
                  {t.onlineLobby.roomCode}
                  <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} style={inputStyle} maxLength={12} />
                </label>
                <button
                  onClick={() => joinRoom(joinCode.trim(), nickname, { asNewPlayer: openedFromInvite })}
                  disabled={!connected || !joinCode.trim()}
                  style={secondaryButton}
                >
                  <Link2 size={18} />
                  {t.onlineLobby.joinRoom}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ fontSize: 10, color: '#92a1bd' }}>{t.onlineLobby.roomCode}</div>
                <div style={{ fontSize: 30, color: '#ffffff', letterSpacing: 3 }}>{roomId}</div>
                <button onClick={copyInvite} style={primaryButton}>
                  <Copy size={18} />
                  {copied ? t.onlineLobby.copiedInvite : t.onlineLobby.copyInvite}
                </button>
                <div style={{ fontSize: 9, color: '#74839f', lineHeight: 1.7, wordBreak: 'break-all' }}>{inviteUrl}</div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
                <PlayerLine label={t.onlineLobby.mySlot} player={me} highlight />
                <PlayerLine label={t.onlineLobby.opponentSlot} player={opponent} />
                {roomState?.status === 'countdown' && (
                  <div style={{ padding: 14, border: '1px solid rgba(255, 209, 92, 0.35)', background: 'rgba(255, 209, 92, 0.1)', color: '#ffd15c', fontSize: 12 }}>
                    {t.onlineLobby.countdown(countdown)}
                  </div>
                )}
              </div>
            )}
            {error && <div style={{ marginTop: 14, color: '#ff6b7a', fontSize: 10, lineHeight: 1.6 }}>{getOnlineErrorText(error, language)}</div>}
          </div>

          {roomId && (
            <div style={panelStyle}>
              <div style={panelTitleStyle}>
                <Swords size={18} />
                <span>{t.onlineLobby.chooseCharacter}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(142px, 1fr))', gap: 12, overflowY: 'auto', paddingRight: 4 }}>
                {characters.map((character) => {
                  const selected = me?.characterId === character.id;
                  const taken = opponent?.characterId === character.id;
                  return (
                    <button
                      key={character.id}
                      onClick={() => selectCharacter(character.id)}
                      disabled={taken || !canEditLobby}
                      style={{
                        minHeight: 142,
                        border: `2px solid ${selected ? character.color : taken ? '#39445a' : 'rgba(255,255,255,0.14)'}`,
                        background: selected ? `${character.color}22` : 'rgba(255,255,255,0.045)',
                        color: '#f5f7fb',
                        borderRadius: 8,
                        cursor: taken ? 'not-allowed' : 'pointer',
                        opacity: taken ? 0.36 : 1,
                        display: 'grid',
                        placeItems: 'center',
                        gap: 8,
                        padding: 12,
                        boxShadow: selected ? `0 0 26px ${character.color}44` : 'none',
                      }}
                    >
                      <div style={{ fontSize: 42 }}>{character.sprite}</div>
                      <div style={{ color: character.color, fontSize: 11 }}>{getCharacterName(character, language)}</div>
                      <div style={{ color: '#9aa8c0', fontSize: 8 }}>{getCharacterTitle(character, language)}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ color: '#8998b4', fontSize: 10, lineHeight: 1.7 }}>
                  {t.onlineLobby.readyHint}
                </div>
                <button onClick={() => setReady(!me?.ready)} disabled={!me?.characterId || !canEditLobby} style={me?.ready ? readyButton : primaryButton}>
                  <UserCheck size={18} />
                  {me?.ready ? t.onlineLobby.cancelReady : t.onlineLobby.ready}
                </button>
              </div>
            </div>
          )}
        </section>

        <footer style={{ color: '#526079', fontSize: 9, display: 'flex', justifyContent: 'space-between' }}>
          <span>Socket.IO server: {socketServerUrl}</span>
          <span>{t.onlineLobby.localUnaffected}</span>
        </footer>
      </main>
    </div>
  );
}

function PlayerLine({ label, player, highlight }: { label: string; player: { nickname: string; ready: boolean; connected: boolean; characterId: string | null } | null; highlight?: boolean }) {
  const { t } = useI18n();
  return (
    <div style={{ padding: 12, background: highlight ? 'rgba(123,231,199,0.09)' : 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
      <div style={{ color: '#7e8da8', fontSize: 9, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ color: '#f5f7fb', fontSize: 11 }}>{player?.nickname || t.onlineLobby.waitingJoin}</span>
        <span style={{ color: player?.ready ? '#7be7c7' : '#ffd15c', fontSize: 9 }}>{player ? (player.ready ? t.onlineLobby.readyStatus : t.onlineLobby.waitStatus) : t.onlineLobby.emptyStatus}</span>
      </div>
      <div style={{ color: '#7d8da7', fontSize: 9, marginTop: 8 }}>{player?.characterId || t.common.notSelected} · {player?.connected ? t.common.online : t.common.offline}</div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  minHeight: 0,
  background: 'rgba(7, 12, 24, 0.74)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: 18,
  boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(16px)',
};

const panelTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#7be7c7',
  fontSize: 12,
  marginBottom: 18,
};

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  color: '#8ea0bf',
  fontSize: 10,
};

const inputStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: '#f5f7fb',
  padding: '0 12px',
  fontFamily: 'inherit',
  fontSize: 11,
  outline: 'none',
};

const primaryButton: React.CSSProperties = {
  height: 46,
  borderRadius: 6,
  border: '1px solid rgba(123,231,199,0.55)',
  background: 'linear-gradient(180deg, rgba(123,231,199,0.24), rgba(22,145,113,0.28))',
  color: '#ddfff6',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 10,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  border: '1px solid rgba(255,209,92,0.55)',
  background: 'linear-gradient(180deg, rgba(255,209,92,0.2), rgba(177,104,20,0.26))',
  color: '#fff1c8',
};

const readyButton: React.CSSProperties = {
  ...primaryButton,
  border: '1px solid rgba(255,107,122,0.55)',
  background: 'linear-gradient(180deg, rgba(255,107,122,0.25), rgba(165,38,54,0.3))',
  color: '#ffe4e8',
};

const ghostButton: React.CSSProperties = {
  height: 40,
  padding: '0 16px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.04)',
  color: '#b8c5da',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 10,
};
