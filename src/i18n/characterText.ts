import type { Character } from '@/data/characters';
import { messages } from '@/i18n/messages';
import type { Language } from '@/store/settingsStore';

export function getCharacterName(character: Character | null | undefined, language: Language): string {
  if (!character) return '';
  return messages[language].characters[character.id]?.name || character.name;
}

export function getCharacterTitle(character: Character | null | undefined, language: Language): string {
  if (!character) return '';
  return messages[language].characters[character.id]?.title || character.title;
}

