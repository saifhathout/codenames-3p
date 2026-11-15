export const COLORS = Object.freeze({
  TARGET: 'target',
  NEUTRAL: 'neutral',
  ASSASSIN: 'assassin',
});

export const ROLES = Object.freeze({
  SPYMASTER: 'spymaster',
  OPERATIVE: 'operative',
});

export const STATUS = Object.freeze({
  LOBBY: 'lobby',
  POWER_SELECT: 'powerSelect',
  PLAYING: 'playing',
  GAME_END: 'gameEnd',
});

export const POWER_IDS = Object.freeze({
  BLOCK_TURN: 'blockTurn',
  SAFE_MISTAKE: 'safeMistake',
  DOUBLE_POINTS: 'doublePoints',
  SPY_VISION: 'spyVision',
  UNDO: 'undo',
  STEAL_POINTS: 'stealPoints',
  LOCK_WORD: 'lockWord',
  JACKPOT: 'jackpot',
});

export const POWERS = {
  [POWER_IDS.BLOCK_TURN]: {
    name: 'Block Turn',
    icon: '🚫',
    description: 'Prevent opponent from guessing on the next clue.',
  },
  [POWER_IDS.SAFE_MISTAKE]: {
    name: 'Safe Mistake',
    icon: '🛡️',
    description: 'Protects you from your next Neutral word (automatic).',
  },
  [POWER_IDS.DOUBLE_POINTS]: {
    name: 'Double Points',
    icon: '×2',
    description: 'Next correct guess gives 4 points instead of 2.',
  },
  [POWER_IDS.SPY_VISION]: {
    name: 'Spy Vision',
    icon: '👁️',
    description: 'Reveals the color of one word for 3 seconds.',
  },
  [POWER_IDS.UNDO]: {
    name: 'Undo',
    icon: '↩️',
    description: 'Undo your last Neutral pick within 5 seconds.',
  },
  [POWER_IDS.STEAL_POINTS]: {
    name: 'Steal Points',
    icon: '🦹',
    description: 'Steal 2 points from opponent (uses your turn).',
  },
  [POWER_IDS.LOCK_WORD]: {
    name: 'Lock Word',
    icon: '🔒',
    description: 'Lock a word from opponent for one turn.',
  },
  [POWER_IDS.JACKPOT]: {
    name: 'Jackpot',
    icon: '💰',
    description: '+3 bonus points after 2 consecutive correct guesses.',
  },
};

export const BOARD_SIZE = 25;
export const TARGET_COUNT = 16;
export const NEUTRAL_COUNT = 8;
export const MAX_CLUES = 10;
export const POWERS_PER_PLAYER = 3;
export const UNDO_WINDOW_MS = 5000;
export const SPY_VISION_MS = 3000;

// Word lists (unchanged)
export const WORDS_AR = [
  'بيت','شمس','قمر','بحر','جبل','كتاب','قلم','باب','نافذة','كرسي',
  'طاولة','سيارة','شجرة','زهرة','قطة','كلب','طائر','سمكة','خبز','ماء',
  'نار','هواء','حجر','ذهب','فضة','حديد','زجاج','ورق','حبل','مفتاح',
  'ساعة','مرآة','مظلة','حذاء','قبعة','حقيبة','هاتف','حاسوب','مدينة','قرية',
];

export const WORDS_EN = [
  'apple','moon','sun','star','ocean','mountain','book','pen','door','window',
  'chair','table','car','tree','flower','cat','dog','bird','fish','bread',
  'water','fire','air','stone','gold','silver','iron','glass','paper','rope',
  'key','clock','mirror','umbrella','shoe','hat','bag','phone','computer','city',
];