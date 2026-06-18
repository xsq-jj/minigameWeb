import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import TitleScreen from '@/components/TitleScreen';
import CharacterSelect from '@/components/CharacterSelect';
import BattleArena from '@/components/BattleArena';
import VictoryScreen from '@/components/VictoryScreen';
import OnlineLobby from '@/components/OnlineLobby';
import BattleArenaOnline from '@/components/BattleArenaOnline';
import { useOnlineStore } from '@/store/onlineStore';
import { useI18n } from '@/i18n';

export default function App() {
  const { language, t } = useI18n();
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const onlineStage = useOnlineStore((s) => s.stage);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = t.title.title;
  }, [language, t.title.title]);

  useEffect(() => {
    if (onlineStage === 'battle' && screen === 'online') {
      setScreen('onlineBattle');
    }
    if (onlineStage === 'lobby' && screen === 'onlineBattle') {
      setScreen('online');
    }
  }, [onlineStage, screen, setScreen]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'select' && <CharacterSelect />}
      {screen === 'battle' && <BattleArena />}
      {screen === 'victory' && <VictoryScreen />}
      {screen === 'online' && <OnlineLobby />}
      {screen === 'onlineBattle' && <BattleArenaOnline />}
    </div>
  );
}
