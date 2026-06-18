import { create } from 'zustand';

export type Language = 'zh' | 'en';

const STORAGE_KEY = 'office-fighter:language';

function readInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

interface SettingsStore {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  language: readInitialLanguage(),
  setLanguage: (language) => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Storage is a convenience only; the in-memory setting still works.
    }
    set({ language });
  },
  toggleLanguage: () => {
    get().setLanguage(get().language === 'zh' ? 'en' : 'zh');
  },
}));
