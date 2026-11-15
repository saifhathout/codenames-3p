import assert from 'node:assert';
import { buildBoard } from '../domain/board.js';
import { createRoom, addPlayer } from '../domain/room.js';
import { assignRoles, getSpymaster } from '../domain/roles.js';
import { publicRoom } from '../domain/views.js';
import { spymasterPointsForRounds, finalizeGame } from '../domain/scoring.js';
import { COLORS, STATUS } from '../domain/constants.js';

console.log('▶ Phase 1 domain tests');

// 1. Board composition
const board = buildBoard('en');
assert.equal(board.length, 25, 'board size');
assert.equal(board.filter(c => c.color === COLORS.TARGET).length, 16, 'targets');
assert.equal(board.filter(c => c.color === COLORS.NEUTRAL).length, 8, 'neutral');
assert.equal(board.filter(c => c.color === COLORS.ASSASSIN).length, 1, 'assassin');
assert.equal(new Set(board.map(c => c.word)).size, 25, 'unique words');

// 2. Role rotation
const room = createRoom({ hostId: 'A', hostName: 'Alice', code: 'TEST' });
addPlayer(room, { id: 'B', name: 'Bob' });
addPlayer(room, { id: 'C', name: 'Carol' });
room.board = board;

for (let g = 1; g <= 3; g++) {
  room.gameNumber = g;
  assignRoles(room);
  const spies = room.players.filter(p => p.role === 'spymaster');
  assert.equal(spies.length, 1, `game ${g}: exactly one spymaster`);
  assert.equal(room.players[g % 3].role, 'spymaster', `game ${g}: correct spy`);
}
assignRoles(room);

// 3. Spymaster scoring
assert.equal(spymasterPointsForRounds(1), 5);
assert.equal(spymasterPointsForRounds(2), 4);
assert.equal(spymasterPointsForRounds(3), 3);
assert.equal(spymasterPointsForRounds(4), 2);
assert.equal(spymasterPointsForRounds(5), 1);
assert.equal(spymasterPointsForRounds(99), 1);

// 4. Security: operative view hides colors
room.status = STATUS.PLAYING;
room.gameNumber = 1;
assignRoles(room);
const spy = getSpymaster(room);
const op = room.players.find(p => p.role === 'operative');

const spyView = publicRoom(room, spy.id);
const opView = publicRoom(room, op.id);

assert.ok(spyView.board.every(c => c.color !== null), 'spy sees all colors');
assert.ok(opView.board.every(c => c.color === null), 'operative sees no colors');

// 5. Guessed card revealed to operative
room.guessedCardIds.add(3);
room.guessLog[3] = { playerId: op.id };
const opView2 = publicRoom(room, op.id);
assert.notEqual(opView2.board[3].color, null, 'guessed card revealed');
assert.equal(opView2.board[3].guessedBy, op.id);

console.log('✅ Phase 1 passed');