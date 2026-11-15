import assert from 'node:assert';
import { io as client } from 'socket.io-client';

const URL = 'http://localhost:3001';
console.log('▶ Phase 3 socket e2e');

function connect() {
  return new Promise((res, rej) => {
    const s = client(URL, { forceNew: true });
    s.on('connect', () => res(s));
    s.on('connect_error', rej);
  });
}
function emitAck(sock, event, payload) {
  return new Promise(res => sock.emit(event, payload, res));
}
function nextUpdate(sock) {
  return new Promise(res => sock.once('room:update', res));
}

const [a, b, c] = await Promise.all([connect(), connect(), connect()]);

const r1 = await emitAck(a, 'room:create', { name: 'A', lang: 'en' });
assert.ok(r1.ok, `create: ${r1.error}`);
const code = r1.code;
const idA = r1.playerId;

const pB = nextUpdate(a); // A gets update when B joins
const r2 = await emitAck(b, 'room:join', { code, name: 'B' });
assert.ok(r2.ok);
await pB;
const idB = r2.playerId;

const pC = nextUpdate(a);
const r3 = await emitAck(c, 'room:join', { code, name: 'C' });
assert.ok(r3.ok);
await pC;
const idC = r3.playerId;

// Start game
const started = Promise.all([nextUpdate(a), nextUpdate(b), nextUpdate(c)]);
await emitAck(a, 'game:start', {});
const [ua, ub, uc] = await started;

// Find spy
const spyId = ua.players.find(p => p.role === 'spymaster').id;
const socks = { [idA]: a, [idB]: b, [idC]: c };
const spySock = socks[spyId];

// Spy sees colors; operatives do not
const spyState = ua.players.find(p => p.id === idA)?.role === 'spymaster'
  ? ua : (ub.players.find(p => p.id === idB)?.role === 'spymaster' ? ub : uc);
const opState = ua.players.find(p => p.id === idA)?.role === 'operative' ? ua : ub;
assert.ok(spyState.board.every(x => x.color !== null), 'spy colors visible');
assert.ok(opState.board.every(x => x.color === null), 'operative colors hidden');

// Spy gives clue
const clueUpdate = nextUpdate(spySock);
await emitAck(spySock, 'clue:give', { word: 'test', number: 1 });
await clueUpdate;

// Wrong-turn guess rejected
const opIds = [idA, idB, idC].filter(id => id !== spyId);
const notTurn = opIds.find(id => id !== ua.currentTurn)
  ?? opIds[1];
const bad = await emitAck(socks[notTurn], 'card:guess', { cardId: 0 });
// note: ua.currentTurn after clue should point to first op
assert.ok(!bad.ok, 'wrong-turn guess rejected');

// Cleanup
a.close(); b.close(); c.close();
console.log('✅ Phase 3 passed');