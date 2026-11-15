import assert from 'node:assert';
import * as roomSvc from '../application/roomService.js';
import * as gameSvc from '../application/gameService.js';
import { roomStore } from '../store/roomStore.js';
import { publicRoom } from '../domain/views.js';
import { STATUS } from '../domain/constants.js';

console.log('▶ Phase 2 service tests');

// Create room
const { room, playerId: A } = roomSvc.createRoomFor({ name: 'Alice', lang: 'en' });
const code = room.code;
assert.equal(room.players.length, 1);

// Join
const { playerId: B } = roomSvc.joinRoom({ code, name: 'Bob' });
const { playerId: C } = roomSvc.joinRoom({ code, name: 'Carol' });
assert.equal(room.players.length, 3);

// Cannot join a 4th
assert.throws(() => roomSvc.joinRoom({ code, name: 'Dave' }), /full/);

// Non-host cannot start
assert.throws(() => gameSvc.startGame({ code, hostId: B }), /host/);

// Host starts
gameSvc.startGame({ code, hostId: A });
assert.equal(room.status, STATUS.PLAYING);
assert.equal(room.gameNumber, 1);
assert.ok(room.board.length === 25);

// Find spy
const spy = room.players.find(p => p.role === 'spymaster');
const opA = room.players.find(p => p.role === 'operative' && p.id !== spy.id);
const opB = room.players.find(p => p.role === 'operative' && p.id !== opA.id);

// Only spy gives clue
assert.throws(
  () => gameSvc.giveClue({ code, playerId: opA.id, word: 'x', number: 1 }),
  /Spymaster/
);

// Valid clue sets turn to first operative
gameSvc.giveClue({ code, playerId: spy.id, word: 'animal', number: 2 });
assert.equal(room.currentTurn, room.players.filter(p => p.role === 'operative')[0].id);
assert.equal(room.roundsThisGame, 1);

// Invalid clue rejected
assert.throws(
  () => gameSvc.giveClue({ code, playerId: spy.id, word: '', number: 1 }),
  /Invalid/
);
assert.throws(
  () => gameSvc.giveClue({ code, playerId: spy.id, word: 'x', number: 0 }),
  /Invalid/
);

// Wrong-turn guess rejected
const notTurn = [opA.id, opB.id].find(id => id !== room.currentTurn);
assert.throws(
  () => gameSvc.guessCard({ code, playerId: notTurn, cardId: 0 }),
  /turn/
);

// Correct guess switches turn
const current = room.currentTurn;
gameSvc.guessCard({ code, playerId: current, cardId: 0 });
assert.notEqual(room.currentTurn, current, 'turn switched');

// Public view: operative never sees colors
const opView = publicRoom(room, opA.id);
assert.ok(opView.board.filter(c => !c.guessed).every(c => c.color === null));
const spyView = publicRoom(room, spy.id);
assert.ok(spyView.board.every(c => c.color !== null));

// Assassin ends game
const assassin = room.board.find(c => c.color === 'assassin');
gameSvc.giveClue({ code, playerId: spy.id, word: 'end', number: 1 });
const assassinGuy = room.currentTurn;
const scoreBefore = room.gameScores[assassinGuy] || 0;
gameSvc.guessCard({ code, playerId: assassinGuy, cardId: assassin.id });
assert.equal(room.status, STATUS.GAME_END);
assert.equal(room.assassinHit, true);
assert.ok(room.winner, 'winner set');
assert.equal(
  room.gameScores[assassinGuy],
  scoreBefore - 2,
  'assassin penalty subtracts exactly 2'
);
console.log('✅ Phase 2 passed');