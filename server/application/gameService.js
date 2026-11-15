import { buildBoard } from '../domain/board.js';
import {
  assignRoles, getSpymaster, getOperatives, getOpponent
} from '../domain/roles.js';
import {
  isValidClue, canGuess, gameOverReason, isExcluded,
  getMaxGuesses, guessesLeft, hasEndedTurn,
} from '../domain/gameRules.js';
import { awardGuess, finalizeGame } from '../domain/scoring.js';
import {
  validatePowerChoice, initPowerState, hasPower,
  isPowerAvailable, consumePower
} from '../domain/powers.js';
import {
  STATUS, COLORS, POWER_IDS, MAX_CLUES,
  UNDO_WINDOW_MS, SPY_VISION_MS, POWERS_PER_PLAYER
} from '../domain/constants.js';
import { roomStore } from '../store/roomStore.js';

function resetForNewGame(room) {
  room.status = STATUS.POWER_SELECT;
  room.board = buildBoard(room.lang);
  room.currentClue = null;
  room.clueCount = 0;
  room.excludedCardIds = new Set();
  room.blockedCardIds = new Map();
  room.lockedCardIds = new Map();
  room.guessedCardIds = new Set();
  room.guessLog = {};
  room.lastGuess = null;
  room.lastActivity = Date.now();
  room.gameScores = {};
  room.spyScore = 0;
  room.consecutiveTargets = {};
  room.winner = null;
  room.winnerSpy = null;
  room.blackHit = false;
  room.gameEndReason = null;
  room.pendingUndo = null;
  room.excludedFromClue = new Set();
  room.blockedNextClue = new Set();
  room.guessesThisClue = {};
  room.endedTurnThisClue = new Set();

  room.players.forEach(p => {
    p.powers = [];
    p.powerState = {};
    room.gameScores[p.id] = 0;
  });

  assignRoles(room);
}

export function startGame({ code, hostId, lang }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (room.hostId !== hostId) throw new Error('Only host can start');
  if (room.players.length !== 3) throw new Error('Need exactly 3 players');
  if (room.status !== STATUS.LOBBY) throw new Error('Game already started');
  if (lang) room.lang = lang;
  room.gameNumber = 1;
  resetForNewGame(room);
  return room;
}

export function choosePowers({ code, playerId, powers }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (room.status !== STATUS.POWER_SELECT) throw new Error('Not in power select');
  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');
  if (player.role === 'spymaster') throw new Error('Spymaster does not pick powers');
  if (!validatePowerChoice(powers)) throw new Error('Invalid powers');

  player.powers = powers;
  initPowerState(player);

  const ops = getOperatives(room);
  const allReady = ops.every(op => op.powers.length === POWERS_PER_PLAYER);
  if (allReady) {
    room.status = STATUS.PLAYING;
  }

  return room;
}

export function giveClue({ code, playerId, word, number }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (room.status !== STATUS.PLAYING) throw new Error('Game not playing');
  const spy = getSpymaster(room);
  if (!spy || spy.id !== playerId) throw new Error('Only Spymaster can give clues');
  if (!isValidClue(word, number)) throw new Error('Invalid clue');
  if (room.pendingUndo) throw new Error('Undo pending');

  room.clueCount++;
  if (room.clueCount > MAX_CLUES) {
    throw new Error('Max clues reached');
  }

  // Reset per-clue state
  room.excludedFromClue = new Set();
  room.guessesThisClue = {};
  room.endedTurnThisClue = new Set();
  room.currentClue = {
    word: word.trim(),
    number,
    bySpymasterId: playerId,
    clueIndex: room.clueCount,
  };

  // Apply Block Turn from previous round
  room.blockedNextClue.forEach(blockerId => {
    const opponent = getOpponent(room, blockerId);
    if (opponent) {
      room.excludedFromClue.add(opponent.id);
    }
  });
  room.blockedNextClue = new Set();

  // Clear Lock Word
  room.lockedCardIds = new Map();

  return room;
}

export function guessCard({ code, playerId, cardId, useDoublePoints }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (!canGuess(room, playerId)) {
    if (guessesLeft(room, playerId) <= 0) {
      throw new Error('No guesses left for this clue');
    }
    if (hasEndedTurn(room, playerId)) {
      throw new Error('You ended your turn');
    }
    throw new Error('Cannot guess right now');
  }

  if (room.guessedCardIds.has(cardId)) throw new Error('Card already taken');
  if (room.blockedCardIds.has(cardId)) throw new Error('Card blocked');
  if (room.excludedCardIds.has(cardId)) throw new Error('Card excluded');

  const locked = room.lockedCardIds.get(cardId);
  if (locked && locked.byPlayerId !== playerId) {
    throw new Error('Card locked by opponent');
  }

  const card = room.board.find(c => c.id === cardId);
  if (!card) throw new Error('Card not found');

  const player = room.players.find(p => p.id === playerId);

  if (useDoublePoints && isPowerAvailable(player, POWER_IDS.DOUBLE_POINTS)) {
    player.powerState[POWER_IDS.DOUBLE_POINTS].active = true;
  }

  // Increment guess count
  room.guessesThisClue[playerId] = (room.guessesThisClue[playerId] || 0) + 1;

  room.guessedCardIds.add(cardId);
  room.guessLog[cardId] = { playerId };
  const result = awardGuess(room, playerId, card);
  room.lastGuess = {
    cardId, playerId, color: card.color, points: result.points,
    effects: result.effects,
  };

  if (card.color === COLORS.NEUTRAL
      && isPowerAvailable(player, POWER_IDS.UNDO)
      && !result.effects.includes('safeMistake')) {
    room.pendingUndo = {
      playerId,
      cardId,
      expiresAt: Date.now() + UNDO_WINDOW_MS,
    };
    return room;
  }

  const reason = gameOverReason(room);
  if (reason) {
    finalizeGame(room, reason);
    return room;
  }

  return room;
}

export function endTurn({ code, playerId }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (room.status !== STATUS.PLAYING) throw new Error('Not playing');
  if (!room.currentClue) throw new Error('No active clue');
  if (isExcluded(room, playerId)) throw new Error('You are excluded');
  if (!room.endedTurnThisClue) room.endedTurnThisClue = new Set();
  room.endedTurnThisClue.add(playerId);
  return room;
}

export function resolveUndo({ code, playerId, useUndo }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (!room.pendingUndo) throw new Error('No pending undo');
  if (room.pendingUndo.playerId !== playerId) throw new Error('Not your undo');

  const { cardId } = room.pendingUndo;
  const player = room.players.find(p => p.id === playerId);

  if (useUndo) {
    consumePower(player, POWER_IDS.UNDO);
    room.guessedCardIds.delete(cardId);
    delete room.guessLog[cardId];
    if (room.excludedFromClue) {
      room.excludedFromClue.delete(playerId);
    }
    // Remove the guess from count
    if (room.guessesThisClue[playerId] > 0) {
      room.guessesThisClue[playerId]--;
    }
    room.lastGuess = null;
  }

  room.pendingUndo = null;
  return room;
}

export function usePower({ code, playerId, powerId, payload = {} }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (room.status !== STATUS.PLAYING) throw new Error('Not playing');
  if (room.pendingUndo) throw new Error('Undo pending');

  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');
  if (!hasPower(player, powerId)) throw new Error('Power not owned');
  if (!isPowerAvailable(player, powerId)) throw new Error('Power already used');

  switch (powerId) {
    case POWER_IDS.BLOCK_TURN: {
      if (isExcluded(room, playerId)) throw new Error('You are excluded');
      room.blockedNextClue.add(playerId);
      consumePower(player, powerId);
      break;
    }
    case POWER_IDS.SPY_VISION: {
      const card = room.board.find(c => c.id === payload.cardId);
      if (!card) throw new Error('Card not found');
      if (room.guessedCardIds.has(card.id)) throw new Error('Card taken');
      consumePower(player, powerId);
      room.lastGuess = {
        ...(room.lastGuess || {}),
        spyVision: {
          playerId, cardId: card.id, color: card.color,
          expiresAt: Date.now() + SPY_VISION_MS,
        },
      };
      break;
    }
    case POWER_IDS.LOCK_WORD: {
      const card = room.board.find(c => c.id === payload.cardId);
      if (!card) throw new Error('Card not found');
      if (room.guessedCardIds.has(card.id)) throw new Error('Card taken');
      room.lockedCardIds.set(card.id, {
        byPlayerId: playerId,
        expiresAtTurn: (room.currentClue?.clueIndex || 0) + 1,
      });
      consumePower(player, powerId);
      break;
    }
    case POWER_IDS.STEAL_POINTS: {
      const opponent = getOpponent(room, playerId);
      if (!opponent) throw new Error('No opponent');
      const oppScore = room.gameScores[opponent.id] || 0;
      const steal = Math.min(2, Math.max(0, oppScore));
      room.gameScores[opponent.id] = oppScore - steal;
      room.gameScores[playerId] = (room.gameScores[playerId] || 0) + steal;
      consumePower(player, powerId);
      room.excludedFromClue.add(playerId);
      break;
    }
    default:
      throw new Error('Unknown power');
  }

  const reason = gameOverReason(room);
  if (reason) {
    finalizeGame(room, reason);
  }

  return room;
}

export function nextGame({ code, hostId }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (room.hostId !== hostId) throw new Error('Only host');
  if (room.status !== STATUS.GAME_END) throw new Error('Game not over');
  room.gameNumber++;
  resetForNewGame(room);
  return room;
}