import { ROLES, COLORS, POWERS } from './constants.js';

export function publicRoom(room, viewerId) {
  const viewer = room.players.find(p => p.id === viewerId);
  const isSpy = viewer?.role === ROLES.SPYMASTER;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    lang: room.lang,
    gameNumber: room.gameNumber,
    clueCount: room.clueCount,
    maxClues: 10,
    maxGuesses: room.currentClue ? room.currentClue.number + 1 : 0,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      connected: p.connected,
      gameScore: room.gameScores[p.id] || 0,
      totalScore: room.cumulativeScores[p.id] || 0,
      powers: p.id === viewerId ? p.powers : (p.powers.length || null),
      powerState: p.id === viewerId ? p.powerState : null,
      powersReady: p.powers.length > 0,
      excluded: room.excludedFromClue?.has(p.id) || false,
      guessesThisClue: room.guessesThisClue?.[p.id] || 0,
      endedTurn: room.endedTurnThisClue?.has(p.id) || false,
    })),
    currentClue: room.currentClue,
    lastGuess: room.lastGuess,
    lastActivity: room.lastActivity,
    winner: room.winner,
    winnerSpy: room.winnerSpy,
    blackHit: room.blackHit,
    gameEndReason: room.gameEndReason,
    pendingUndo: room.pendingUndo && room.pendingUndo.playerId === viewerId
      ? { cardId: room.pendingUndo.cardId, expiresAt: room.pendingUndo.expiresAt }
      : (room.pendingUndo ? { pending: true } : null),
    spyScore: room.spyScore,
    board: room.board.map(c => {
      const guessed = room.guessedCardIds.has(c.id);
      const blocked = room.blockedCardIds.has(c.id);
      const locked = room.lockedCardIds.get(c.id);
      const isLockedForMe = locked && locked.byPlayerId !== viewerId;
      const isLockedByMe = locked && locked.byPlayerId === viewerId;
      const excluded = room.excludedCardIds.has(c.id);
      return {
        id: c.id,
        word: c.word,
        guessed,
        guessedBy: guessed ? room.guessLog[c.id].playerId : null,
        color: (isSpy || guessed) ? c.color : null,
        blocked,
        locked: isLockedForMe,
        lockedByMe: isLockedByMe,
        excluded,
      };
    }),
    powersList: !isSpy && !viewer?.powers?.length ? POWERS : null,
  };
}