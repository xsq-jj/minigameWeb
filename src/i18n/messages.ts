import { enUS } from '@/i18n/locales/en-US';
import { zhCN } from '@/i18n/locales/zh-CN';
import type { Language } from '@/store/settingsStore';

export const messages: Record<Language, typeof zhCN> = {
  zh: zhCN,
  en: enUS,
};

