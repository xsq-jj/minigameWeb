export function getProjectileIcon(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes('card') || type.includes('名片')) return '▰';
  if (normalized.includes('audit') || normalized.includes('calculator') || normalized.includes('budget') || type.includes('财务') || type.includes('审计') || type.includes('预算')) return '$';
  if (normalized.includes('storm') || type.includes('风暴')) return '!';
  if (normalized.includes('code') || normalized.includes('keyboard') || type.includes('代码') || type.includes('键盘')) return '</>';
  if (normalized.includes('team') || normalized.includes('room') || type.includes('组织') || type.includes('团建') || type.includes('会议室')) return '★';
  if (normalized.includes('system') || type.includes('系统')) return '💻';
  return '◆';
}

