export function getRoomIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('room');
}

export function buildInviteUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  url.searchParams.set('join', '1');
  return url.toString();
}

export function buildRoomUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  url.searchParams.delete('join');
  return url.toString();
}

export function isInviteJoinUrl(): boolean {
  return new URLSearchParams(window.location.search).get('join') === '1';
}

export function clearRoomFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  url.searchParams.delete('join');
  window.history.replaceState({}, '', url.toString());
}

export function reconnectKey(roomId: string): string {
  return `office-fighter:session-reconnect:${roomId}`;
}

export function getSessionReconnectToken(roomId: string): string | undefined {
  try {
    return sessionStorage.getItem(reconnectKey(roomId)) || undefined;
  } catch {
    return undefined;
  }
}

export function setSessionReconnectToken(roomId: string, token: string): void {
  try {
    sessionStorage.setItem(reconnectKey(roomId), token);
  } catch {
    // Ignore storage failures; the current socket remains authoritative.
  }
}
