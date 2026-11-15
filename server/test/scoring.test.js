import assert from 'node:assert';
import { roomStore } from '../store/roomStore.js';
import * as roomSvc from '../application/roomService.js';
import * as gameSvc from '../application/gameService.js';
import { STATUS } from '../domain/constants.js';

console.log('▶ Phase 7 scoring tests');

function freshRoom() {
  const { room, playerId: A } = roomSvc.createRoomFor({ name: 'A', lang: 'en' });
  const code = room.code;
  const { playerId: B } = roomSvc.joinRoom({ code, name: 'B' });
  const { playerId: C } = roomSvc.joinRoom({ code, name: 'C' });
  gameSvc.startGame({ code, hostId: A });
  return { room, code, A, B, C };
}

function cleanup(code) {
  roomStore.delete(code);
}

// ─────────────────────────────────────────────────────────
// Scenario 1: 1 round, all 16 targets → spy gets 5
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');

  gameSvc.giveClue({ code, playerId: spy.id, word: 'all', number: 9 });
  assert.equal(room.roundsThisGame, 1, 'one round used');

  const targets = room.board.filter(c => c.color === 'target').map(c => c.id);
  assert.equal(targets.length, 16);

  for (const id of targets) {
    gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: id });
  }

  assert.equal(room.status, STATUS.GAME_END, 'game ended');
  assert.equal(room.targetsFound, 16, 'all targets found');
  assert.equal(room.gameScores[spy.id], 5, 'spy scores 5 for 1 round');

  // Operatives each guessed 8 targets (+8), not counting spy
  const ops = room.players.filter(p => p.role === 'operative');
  const opSum = ops.reduce((s, p) => s + (room.gameScores[p.id] || 0), 0);
  assert.equal(opSum, 16, '16 total operative points');

  cleanup(code);
  console.log('  ✓ Scenario 1: 1 round → spy 5');
}

// ─────────────────────────────────────────────────────────
// Scenario 2: 2 rounds, all 16 targets → spy gets 4
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');
  const targets = room.board.filter(c => c.color === 'target').map(c => c.id);

  // Round 1: guess 8 targets
  gameSvc.giveClue({ code, playerId: spy.id, word: 'a', number: 8 });
  for (let i = 0; i < 8; i++) {
    gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: targets[i] });
  }

  // Round 2: guess remaining 8
  gameSvc.giveClue({ code, playerId: spy.id, word: 'b', number: 8 });
  for (let i = 8; i < 16; i++) {
    gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: targets[i] });
  }

  assert.equal(room.status, STATUS.GAME_END);
  assert.equal(room.roundsThisGame, 2);
  assert.equal(room.gameScores[spy.id], 4, 'spy scores 4 for 2 rounds');

  cleanup(code);
  console.log('  ✓ Scenario 2: 2 rounds → spy 4');
}

// ─────────────────────────────────────────────────────────
// Scenario 3: 3 rounds → spy 3
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');
  const targets = room.board.filter(c => c.color === 'target').map(c => c.id);

  const chunks = [6, 5, 5];
  let idx = 0;
  for (const n of chunks) {
    gameSvc.giveClue({ code, playerId: spy.id, word: 'c', number: n });
    for (let i = 0; i < n; i++) {
      gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: targets[idx++] });
    }
  }

  assert.equal(room.status, STATUS.GAME_END);
  assert.equal(room.roundsThisGame, 3);
  assert.equal(room.gameScores[spy.id], 3, 'spy scores 3 for 3 rounds');

  cleanup(code);
  console.log('  ✓ Scenario 3: 3 rounds → spy 3');
}

// ─────────────────────────────────────────────────────────
// Scenario 4: 5 rounds → spy 1
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');
  const targets = room.board.filter(c => c.color === 'target').map(c => c.id);

  const chunks = [4, 3, 3, 3, 3];
  let idx = 0;
  for (const n of chunks) {
    gameSvc.giveClue({ code, playerId: spy.id, word: 'd', number: n });
    for (let i = 0; i < n; i++) {
      gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: targets[idx++] });
    }
  }

  assert.equal(room.status, STATUS.GAME_END);
  assert.equal(room.roundsThisGame, 5);
  assert.equal(room.gameScores[spy.id], 1, 'spy scores 1 for 5 rounds');

  cleanup(code);
  console.log('  ✓ Scenario 4: 5 rounds → spy 1');
}

// ─────────────────────────────────────────────────────────
// Scenario 5: Assassin → game ends, guesser −2 (relative to prior score)
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');
  const assassin = room.board.find(c => c.color === 'assassin');

  gameSvc.giveClue({ code, playerId: spy.id, word: 'die', number: 1 });
  const guesser = room.currentTurn;
  const scoreBefore = room.gameScores[guesser] || 0;

  gameSvc.guessCard({ code, playerId: guesser, cardId: assassin.id });

  assert.equal(room.status, STATUS.GAME_END);
  assert.equal(room.assassinHit, true);
  assert.equal(
    room.gameScores[guesser],
    scoreBefore - 2,
    'assassin subtracts exactly 2 from prior score'
  );
  assert.equal(room.gameScores[spy.id], 5, 'spy still gets 5 for 1 round used');
  assert.ok(room.winner, 'winner assigned');

  cleanup(code);
  console.log('  ✓ Scenario 5: assassin → endgame, −2 penalty');
}

// ─────────────────────────────────────────────────────────
// Scenario 6: Neutral guess = 0 points, turn still switches
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');
  const neutral = room.board.find(c => c.color === 'neutral');

  gameSvc.giveClue({ code, playerId: spy.id, word: 'nothing', number: 1 });
  const guesser = room.currentTurn;
  const before = room.gameScores[guesser] || 0;

  gameSvc.guessCard({ code, playerId: guesser, cardId: neutral.id });

  assert.equal(
    room.gameScores[guesser],
    before,
    'neutral gives no points'
  );
  assert.notEqual(room.currentTurn, guesser, 'turn switched after neutral');
  assert.equal(room.status, STATUS.PLAYING, 'game continues');

  cleanup(code);
  console.log('  ✓ Scenario 6: neutral = 0 points');
}

// ─────────────────────────────────────────────────────────
// Scenario 7: Cumulative scores persist across games
// ─────────────────────────────────────────────────────────
{
  const { room, code, A } = freshRoom();

  // Game 1: end via assassin, note cumulative
  const spy1 = room.players.find(p => p.role === 'spymaster');
  const assassin1 = room.board.find(c => c.color === 'assassin');
  gameSvc.giveClue({ code, playerId: spy1.id, word: 'x', number: 1 });
  gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: assassin1.id });

  const game1Cumulative = { ...room.cumulativeScores };

  // Game 2
  gameSvc.nextGame({ code, hostId: A });
  assert.equal(room.gameNumber, 2);

  const spy2 = room.players.find(p => p.role === 'spymaster');
  const assassin2 = room.board.find(c => c.color === 'assassin');
  gameSvc.giveClue({ code, playerId: spy2.id, word: 'y', number: 1 });
  gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: assassin2.id });

  // Cumulative should be game1 + game2 for each player
  for (const p of room.players) {
    const expected = game1Cumulative[p.id] + room.gameScores[p.id];
    assert.equal(
      room.cumulativeScores[p.id],
      expected,
      `cumulative correct for ${p.name}`
    );
  }

  cleanup(code);
  console.log('  ✓ Scenario 7: cumulative scores accumulate');
}

// ─────────────────────────────────────────────────────────
// Scenario 8: Role rotation over 4 games (spy 1→2→3→1)
// ─────────────────────────────────────────────────────────
{
  const { room, code, A } = freshRoom();

  const spies = [];
  for (let g = 1; g <= 4; g++) {
    spies.push(room.players.find(p => p.role === 'spymaster').id);
    if (g < 4) {
      const assassin = room.board.find(c => c.color === 'assassin');
      const spy = room.players.find(p => p.role === 'spymaster');
      gameSvc.giveClue({ code, playerId: spy.id, word: 'x', number: 1 });
      gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: assassin.id });
      gameSvc.nextGame({ code, hostId: A });
    }
  }

  assert.equal(new Set(spies).size, 3, 'all 3 played spymaster across 3 games');
  assert.equal(spies[0], spies[3], 'game 4 spy = game 1 spy (wrap)');

  cleanup(code);
  console.log('  ✓ Scenario 8: rotation 1→2→3→1');
}

// ─────────────────────────────────────────────────────────
// Scenario 9: Winner = highest cumulative
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');

  // Give all 16 targets in 1 round for max spy score
  gameSvc.giveClue({ code, playerId: spy.id, word: 'all', number: 9});
  const targets = room.board.filter(c => c.color === 'target').map(c => c.id);
  for (const id of targets) {
    gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: id });
  }

  const sorted = [...room.players]
    .sort((a, b) => room.cumulativeScores[b.id] - room.cumulativeScores[a.id]);

  assert.equal(
    room.winner,
    sorted[0].id,
    'winner is highest cumulative score'
  );

  cleanup(code);
  console.log('  ✓ Scenario 9: winner = highest cumulative');
}

// ─────────────────────────────────────────────────────────
// Scenario 10: Round boundary — every clue counts as a round
// ─────────────────────────────────────────────────────────
{
  const { room, code } = freshRoom();
  const spy = room.players.find(p => p.role === 'spymaster');

  // Give 3 clues without any guesses between them
  gameSvc.giveClue({ code, playerId: spy.id, word: 'a', number: 1 });
  gameSvc.giveClue({ code, playerId: spy.id, word: 'b', number: 1 });
  gameSvc.giveClue({ code, playerId: spy.id, word: 'c', number: 1 });

  assert.equal(room.roundsThisGame, 3, 'each clue = 1 round');

  // Force end via assassin
  const assassin = room.board.find(c => c.color === 'assassin');
  gameSvc.guessCard({ code, playerId: room.currentTurn, cardId: assassin.id });

  assert.equal(room.gameScores[spy.id], 3, 'spy gets 3 for 3 rounds');
  assert.equal(room.currentClue.word, 'c', 'last clue is active');

  cleanup(code);
  console.log('  ✓ Scenario 10: clue count = round count');
}

console.log('✅ Phase 7 passed (10 scenarios)');