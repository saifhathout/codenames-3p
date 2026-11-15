import { COLORS, POWER_IDS, MAX_CLUES } from './constants.js';
import { getSpymaster, getOpponent, getOperatives } from './roles.js';
import { isPowerAvailable, consumePower } from './powers.js';

export function awardGuess(room, playerId, card) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return { points: 0, effects: [] };

  const effects = [];
  let points = 0;

  if (card.color === COLORS.TARGET) {
    // Check Double Points
    if (isPowerAvailable(player, POWER_IDS.DOUBLE_POINTS)
        && player.powerState[POWER_IDS.DOUBLE_POINTS].active) {
      points = 4;
      consumePower(player, POWER_IDS.DOUBLE_POINTS);
      player.powerState[POWER_IDS.DOUBLE_POINTS].active = false;
      effects.push('doublePoints');
    } else {
      points = 2;
    }

    room.gameScores[playerId] = (room.gameScores[playerId] || 0) + points;
    room.spyScore = (room.spyScore || 0) + 1;

    // Track consecutive for Jackpot
    room.consecutiveTargets = room.consecutiveTargets || {};
    room.consecutiveTargets[playerId] = (room.consecutiveTargets[playerId] || 0) + 1;

    // Check Jackpot
    if (room.consecutiveTargets[playerId] >= 2) {
      if (isPowerAvailable(player, POWER_IDS.JACKPOT)) {
        consumePower(player, POWER_IDS.JACKPOT);
        room.gameScores[playerId] += 3;
        effects.push('jackpot');
      }
      room.consecutiveTargets[playerId] = 0; // reset after trigger
    }
  } else if (card.color === COLORS.NEUTRAL) {
    // Check Safe Mistake
    if (isPowerAvailable(player, POWER_IDS.SAFE_MISTAKE)) {
      consumePower(player, POWER_IDS.SAFE_MISTAKE);
      effects.push('safeMistake');
      // Player NOT excluded
    } else {
      // Player excluded from clue
      if (!room.excludedFromClue) room.excludedFromClue = new Set();
      room.excludedFromClue.add(playerId);
      effects.push('excluded');
      // Reset consecutive
      room.consecutiveTargets[playerId] = 0;
    }
  } else if (card.color === COLORS.ASSASSIN) {
    room.blackHit = true;
    points = 0;
    effects.push('black');

    // Opponent gets +3
    const opponent = getOpponent(room, playerId);
    if (opponent) {
      room.gameScores[opponent.id] = (room.gameScores[opponent.id] || 0) + 3;
      effects.push('opponentBonus');
    }
  }

  return { points, effects };
}

export function finalizeGame(room, reason) {
  room.status = 'gameEnd';
  room.gameEndReason = reason;

  const spy = getSpymaster(room);
  const ops = getOperatives(room);

  // Winner: highest game score among operatives
  let bestOp = null;
  let bestScore = -Infinity;
  ops.forEach(op => {
    const s = room.gameScores[op.id] || 0;
    if (s > bestScore) {
      bestScore = s;
      bestOp = op;
    }
  });
  room.winner = bestOp?.id || null;

  // Spy score: +1 per target (already tracked), but if black, no extra
  // Actually spyScore is tracked during game. Keep as-is.
  room.winnerSpy = spy?.id || null;

  // Cumulative
  room.players.forEach(p => {
    let gain = 0;
    if (p.role === 'spymaster') {
      gain = room.spyScore || 0;
    } else {
      gain = room.gameScores[p.id] || 0;
    }
    room.cumulativeScores[p.id] = (room.cumulativeScores[p.id] || 0) + gain;
  });
}