import { COLORS } from './constants.js';

export function isValidClue(word, number) {
  if (typeof word !== 'string') return false;
  if (!word.trim() || word.length > 30) return false;
  if (!Number.isInteger(number) || number < 1 || number > 9) return false;
  return true;
}

export function isGameOver(room) {
  const totalTargets = room.board.filter(c => c.color === COLORS.TARGET).length;
  return room.assassinHit || room.targetsFound >= totalTargets;
}