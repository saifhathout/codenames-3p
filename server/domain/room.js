import { STATUS } from './constants.js';

export function createRoom({ hostId, hostName, lang, code }) {
  return {
    code,
    hostId,
    lang: lang || 'ar',
    status: STATUS.LOBBY,
    gameNumber: 0,
    players: [{
      id: hostId, name: hostName, role: null,
      connected: true, socketId: null,
      powers: [],
      powerState: {},
    }],
    board: [],
    currentClue: null,
    clueCount: 0,
    excludedCardIds: new Set(),
    blockedCardIds: new Map(),
    lockedCardIds: new Map(),
    guessedCardIds: new Set(),
    guessLog: {},
    lastGuess: null,
    lastActivity: Date.now(),
    cumulativeScores: { [hostId]: 0 },
    gameScores: {},
    spyScore: 0,
    consecutiveTargets: {},
    winner: null,
    winnerSpy: null,
    blackHit: false,
    gameEndReason: null,
    pendingUndo: null,
    // NEW: guesses per clue per player
    guessesThisClue: {},
    endedTurnThisClue: new Set(),
    excludedFromClue: new Set(),
    blockedNextClue: new Set(),
  };
}

export function addPlayer(room, { id, name }) {
  room.players.push({
    id, name, role: null, connected: true, socketId: null,
    powers: [], powerState: {},
  });
  room.cumulativeScores[id] = 0;
  return room;
}