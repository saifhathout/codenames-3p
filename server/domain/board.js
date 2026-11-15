import { shuffle } from './shuffle.js';
import {
  COLORS, WORDS_AR, WORDS_EN, TARGET_COUNT, NEUTRAL_COUNT
} from './constants.js';

export function buildBoard(lang = 'ar') {
  const pool = lang === 'en' ? WORDS_EN : WORDS_AR;
  const words = shuffle(pool).slice(0, 25);

  const colors = shuffle([
    ...Array(TARGET_COUNT).fill(COLORS.TARGET),
    ...Array(NEUTRAL_COUNT).fill(COLORS.NEUTRAL),
    COLORS.ASSASSIN,
  ]);

  return words.map((word, id) => ({ id, word, color: colors[id] }));
}