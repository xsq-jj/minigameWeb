import { messages } from '@/i18n/messages';
import type { Language } from '@/store/settingsStore';

export const onlineErrorCodes = {
  SOCKET_NOT_CONFIGURED: 'SOCKET_NOT_CONFIGURED',
  CREATE_ROOM_FAILED: 'CREATE_ROOM_FAILED',
  BACKEND_CONNECT_FAILED: 'BACKEND_CONNECT_FAILED',
  JOIN_ROOM_FAILED: 'JOIN_ROOM_FAILED',
  JOIN_ROOM_TIMEOUT: 'JOIN_ROOM_TIMEOUT',
  SELECT_CHARACTER_FAILED: 'SELECT_CHARACTER_FAILED',
  READY_FAILED: 'READY_FAILED',
} as const;

export interface OnlineError {
  code: string;
  fallback?: string;
}

export function onlineError(code: string, fallback?: string): OnlineError {
  return { code, fallback };
}

export function getOnlineErrorText(error: OnlineError, language: Language): string {
  const errorMessages = messages[language].errors;
  const localErrors: Record<string, string> = {
    [onlineErrorCodes.SOCKET_NOT_CONFIGURED]: errorMessages.socketNotConfigured,
    [onlineErrorCodes.CREATE_ROOM_FAILED]: errorMessages.createRoomFailed,
    [onlineErrorCodes.BACKEND_CONNECT_FAILED]: errorMessages.backendConnectFailed,
    [onlineErrorCodes.JOIN_ROOM_FAILED]: errorMessages.joinRoomFailed,
    [onlineErrorCodes.JOIN_ROOM_TIMEOUT]: errorMessages.joinRoomTimeout,
    [onlineErrorCodes.SELECT_CHARACTER_FAILED]: errorMessages.selectCharacterFailed,
    [onlineErrorCodes.READY_FAILED]: errorMessages.readyFailed,
  };

  return errorMessages.server[error.code] || localErrors[error.code] || error.fallback || errorMessages.unknown;
}

