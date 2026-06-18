import type { Character, Skill } from '@/data/characters';
import { messages } from '@/i18n/messages';
import type { Language } from '@/store/settingsStore';

export type SkillSlot = 'attack' | 'skill1' | 'skill2' | 'ultimate';

const serverSkillToSlot: Record<string, SkillSlot> = {
  keyboard_strike: 'attack',
  code_injection: 'skill1',
  rush_commit: 'skill2',
  system_crash: 'ultimate',
  folder_slap: 'attack',
  performance_talk: 'skill1',
  team_optimization: 'skill2',
  layoff_storm: 'ultimate',
  boss_slap: 'attack',
  meeting_call: 'skill1',
  salary_pressure: 'skill2',
  dont_come_tomorrow: 'ultimate',
  calculator_hit: 'attack',
  precise_budget: 'skill1',
  expense_receipt: 'skill2',
  financial_audit: 'ultimate',
  business_card: 'attack',
  hard_sell: 'skill1',
  customer_relation: 'skill2',
  contract_time: 'ultimate',
  stationery_box: 'attack',
  room_booking: 'skill1',
  afternoon_tea: 'skill2',
  team_building: 'ultimate',
};

export function getSkillSlotByIndex(index: number): Exclude<SkillSlot, 'attack'> {
  if (index === 0) return 'skill1';
  if (index === 1) return 'skill2';
  return 'ultimate';
}

export function getSkillSlotByServerName(skillName: string): SkillSlot | null {
  return serverSkillToSlot[skillName] || null;
}

export function getSkillName(character: Character | null | undefined, slot: SkillSlot, language: Language): string {
  if (!character) return '';
  return messages[language].skills[character.id]?.[slot]?.name || character.skills[slot].name;
}

export function getSkillDescription(character: Character | null | undefined, slot: SkillSlot, language: Language): string {
  if (!character) return '';
  return messages[language].skills[character.id]?.[slot]?.description || character.skills[slot].description;
}

export function getSkillText(character: Character | null | undefined, slot: SkillSlot, language: Language): Skill {
  if (!character) {
    throw new Error('Character is required to resolve skill text');
  }
  return {
    ...character.skills[slot],
    name: getSkillName(character, slot, language),
    description: getSkillDescription(character, slot, language),
  };
}

export function getLocalizedSkillEventName(
  character: Character | null | undefined,
  skillIndex: number,
  serverSkillName: string,
  language: Language
): string {
  const slot = getSkillSlotByServerName(serverSkillName) || getSkillSlotByIndex(skillIndex);
  return getSkillName(character, slot, language) || serverSkillName;
}
