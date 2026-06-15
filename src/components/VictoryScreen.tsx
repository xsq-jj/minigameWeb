import { useGameStore } from '@/store/gameStore';

export default function VictoryScreen() {
  const { winner, player1Character, player2Character, setScreen, reset } = useGameStore();

  const winnerChar = winner === 1 ? player1Character : player2Character;
  const loserChar = winner === 1 ? player2Character : player1Character;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 胜利光环 */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${winnerChar?.color}33 0%, transparent 70%)`,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />

      {/* 装饰 */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          fontSize: '40px',
          animation: 'float 2s ease-in-out infinite',
        }}
      >
        🎉
      </div>
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          fontSize: '30px',
          animation: 'float 2.5s ease-in-out infinite 0.3s',
        }}
      >
        🏆
      </div>
      <div
        style={{
          position: 'absolute',
          top: '25%',
          right: '20%',
          fontSize: '30px',
          animation: 'float 2.2s ease-in-out infinite 0.6s',
        }}
      >
        ✨
      </div>

      {/* 胜利标题 */}
      <div
        className="animate-slide-up"
        style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(28px, 6vw, 56px)',
            color: winnerChar?.color || '#ffd700',
            textShadow: `
              0 0 20px ${winnerChar?.color || '#ffd700'},
              0 0 40px ${winnerChar?.color || '#ffd700'},
              4px 4px 0 #1a1a2e
            `,
            marginBottom: '10px',
          }}
        >
          玩家{winner} 获胜!
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#aaaacc',
          }}
        >
          {winnerChar?.name} ({winnerChar?.title}) 获得了胜利!
        </p>
      </div>

      {/* 角色展示 */}
      <div
        className="animate-slide-up"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          marginBottom: '50px',
        }}
      >
        {/* 赢家 */}
        <div
          style={{
            textAlign: 'center',
            padding: '30px',
            background: `linear-gradient(180deg, ${winnerChar?.color}22 0%, ${winnerChar?.color}11 100%)`,
            borderRadius: '20px',
            border: `4px solid ${winnerChar?.color}`,
            boxShadow: `0 0 40px ${winnerChar?.color}44`,
          }}
        >
          <div
            style={{
              fontSize: '100px',
              filter: `drop-shadow(0 0 20px ${winnerChar?.color})`,
            }}
          >
            {winnerChar?.sprite}
          </div>
          <div
            style={{
              fontSize: '18px',
              color: winnerChar?.color,
              marginTop: '10px',
            }}
          >
            {winnerChar?.name}
          </div>
          <div style={{ fontSize: '12px', color: '#aaaacc' }}>{winnerChar?.title}</div>
          <div
            style={{
              fontSize: '14px',
              color: '#ffd700',
              marginTop: '10px',
            }}
          >
            👑 冠军
          </div>
        </div>

        {/* VS */}
        <div
          style={{
            fontSize: '40px',
            color: '#ffd700',
          }}
        >
          VS
        </div>

        {/* 输家 */}
        <div
          style={{
            textAlign: 'center',
            padding: '30px',
            background: 'rgba(30, 30, 50, 0.5)',
            borderRadius: '20px',
            border: '3px solid #4a4a6a',
            opacity: 0.6,
          }}
        >
          <div
            style={{
              fontSize: '80px',
              opacity: 0.5,
            }}
          >
            {loserChar?.sprite}
          </div>
          <div
            style={{
              fontSize: '16px',
              color: '#666688',
              marginTop: '10px',
            }}
          >
            {loserChar?.name}
          </div>
          <div style={{ fontSize: '10px', color: '#444466' }}>{loserChar?.title}</div>
        </div>
      </div>

      {/* 按钮 */}
      <div
        className="animate-slide-up"
        style={{
          display: 'flex',
          gap: '20px',
        }}
      >
        <button
          onClick={reset}
          style={{
            padding: '18px 40px',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: 'linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%)',
            border: '3px solid #66BB6A',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 0 #1b5e20',
          }}
        >
          再来一局
        </button>
        <button
          onClick={() => {
            reset();
            setScreen('select');
          }}
          style={{
            padding: '18px 40px',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: 'linear-gradient(180deg, #ff9800 0%, #e65100 100%)',
            border: '3px solid #ffb74d',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 0 #bf360c',
          }}
        >
          更换角色
        </button>
        <button
          onClick={() => {
            reset();
            setScreen('title');
          }}
          style={{
            padding: '18px 40px',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: 'rgba(60, 60, 80, 0.8)',
            border: '2px solid #4a4a6a',
            borderRadius: '8px',
            color: '#aaaacc',
            cursor: 'pointer',
          }}
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
