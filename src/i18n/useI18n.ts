import { messages } from '@/i18n/messages';
import { useSettingsStore } from '@/store/settingsStore';

export function useI18n() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const toggleLanguage = useSettingsStore((state) => state.toggleLanguage);

  return {
    language,
    setLanguage,
    toggleLanguage,
    t: messages[language],
  };
}

