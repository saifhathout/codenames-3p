import { COLORS, MAX_CLUES, UNDO_WINDOW_MS } from './constants.js';
import { getOperatives } from './roles.js';

export function isExcluded(room, playerId) {
  return room.excludedFromClue?.has(playerId) || false;
}

export function hasEndedTurn(room, playerId) {
  return room.endedTurnThisClue?.has(playerId) || false;
}

export function getMaxGuesses(room) {
  if (!room.currentClue) return 0;
  return room.currentClue.number + 1;
}

export function guessesLeft(room, playerId) {
  const max = getMaxGuesses(room);
  const used = room.guessesThisClue?.[playerId] || 0;
  return Math.max(0, max - used);
}

export function canGuess(room, playerId) {
  if (room.status !== 'playing') return false;
  if (!room.currentClue) return false;
  if (isExcluded(room, playerId)) return false;
  if (hasEndedTurn(room, playerId)) return false;
  if (room.pendingUndo) return false;
  if (guessesLeft(room, playerId) <= 0) return false;
  return true;
}

export function isValidClue(word, number) {
  if (typeof word !== 'string') return false;
  if (!word.trim() || word.length > 30) return false;
  if (!Number.isInteger(number) || number < 1 || number > 9) return false;
  return true;
}

export function gameOverReason(room) {
  if (room.blackHit) return 'black';
  const revealed = room.board.filter(
    c => c.color === COLORS.TARGET && room.guessedCardIds.has(c.id)
  ).length;
  if (revealed >= 16) return 'allTargets';
  if (room.clueCount >= MAX_CLUES) return 'maxClues';
  return null;
}

export function shouldExpireUndo(room) {
  if (!room.pendingUndo) return false;
  return Date.now() > room.pendingUndo.expiresAt;
}