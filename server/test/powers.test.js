import assert from 'node:assert';
import { roomStore } from '../store/roomStore.js';
import * as roomSvc from '../application/roomService.js';
import * as gameSvc from '../application/gameService.js';
import { STATUS, POWER_IDS } from '../domain/constants.js';
import { getSpymaster, getOperatives } from '../domain/roles.js';

console.log('▶ Powers tests');

function setup() {
  const { room, playerId: A } = roomSvc.createRoomFor({ name: 'A', lang: 'en' });
  const code = room.code;
  const { playerId: B } = roomSvc.joinRoom({ code, name: 'B' });
  const { playerId: C } = roomSvc.joinRoom({ code, name: 'C' });
  gameSvc.startGame({ code, hostId: A });
  return { room, code, A, B, C };
}

// Test 1: Power selection flow
{
  const { room, code } = setup();
  assert.equal(room.status, STATUS.POWER_SELECT);

  const spy = getSpymaster(room);
  const ops = getOperatives(room);
  const opA = ops[0], opB = ops[1];

  // Spy cannot choose
  assert.throws(
    () => gameSvc.choosePowers({
      code, playerId: spy.id,
      powers: [POWER_IDS.DOUBLE_POINTS, POWER_IDS.SAFE_MISTAKE, POWER_IDS.UNDO],
    }),
    /Spymaster/
  );

  // Invalid powers
  assert.throws(
    () => gameSvc.choosePowers({
      code, playerId: opA.id, powers: ['fake'],
    }),
    /Invalid/
  );

  // Op A picks
  gameSvc.choosePowers({
    code, playerId: opA.id,
    powers: [POWER_IDS.DOUBLE_POINTS, POWER_IDS.SAFE_MISTAKE, POWER_IDS.UNDO],
  });
  assert.equal(room.status, STATUS.POWER_SELECT); // B not ready

  // Op B picks
  gameSvc.choosePowers({
    code, playerId: opB.id,
    powers: [POWER_IDS.BLOCK_TURN, POWER_IDS.SPY_VISION, POWER_IDS.LOCK_WORD],
  });
  assert.equal(room.status, STATUS.PLAYING);

  roomStore.delete(code);
  console.log('  ✓ Power selection');
}

// Test 2: Double Points
{
  const { room, code } = setup();
  const ops = getOperatives(room);
  const opA = ops[0], opB = ops[1];
  gameSvc.choosePowers({
    code, playerId: opA.id,
    powers: [POWER_IDS.DOUBLE_POINTS, POWER_IDS.SAFE_MISTAKE, POWER_IDS.UNDO],
  });
  gameSvc.choosePowers({
    code, playerId: opB.id,
    powers: [POWER_IDS.BLOCK_TURN, POWER_IDS.SPY_VISION, POWER_IDS.LOCK_WORD],
  });

  const spy = getSpymaster(room);
  gameSvc.giveClue({ code, playerId: spy.id, word: 'x', number: 3 });

  const target = room.board.find(c => c.color === 'target');
  gameSvc.guessCard({
    code, playerId: opA.id, cardId: target.id, useDoublePoints: true,
  });

  assert.equal(room.gameScores[opA.id], 4, 'double points = 4');
  assert.equal(room.spyScore, 1, 'spy +1');

  roomStore.delete(code);
  console.log('  ✓ Double Points');
}

// Test 3: Safe Mistake
{
  const { room, code } = setup();
  const ops = getOperatives(room);
  const opA = ops[0], opB = ops[1];
  gameSvc.choosePowers({
    code, playerId: opA.id,
    powers: [POWER_IDS.SAFE_MISTAKE, POWER_IDS.DOUBLE_POINTS, POWER_IDS.UNDO],
  });
  gameSvc.choosePowers({
    code, playerId: opB.id,
    powers: [POWER_IDS.BLOCK_TURN, POWER_IDS.SPY_VISION, POWER_IDS.LOCK_WORD],
  });

  const spy = getSpymaster(room);
  gameSvc.giveClue({ code, playerId: spy.id, word: 'x', number: 3 });

  const neutral = room.board.find(c => c.color === 'neutral');
  gameSvc.guessCard({ code, playerId: opA.id, cardId: neutral.id });

  const opAPlayer = room.players.find(p => p.id === opA.id);
  assert.equal(opAPlayer.powerState[POWER_IDS.SAFE_MISTAKE].available, false);
  assert.equal(room.excludedFromClue.has(opA.id), false, 'not excluded');

  roomStore.delete(code);
  console.log('  ✓ Safe Mistake');
}

// Test 4: Black ends game
{
  const { room, code } = setup();
  const ops = getOperatives(room);
  const opA = ops[0], opB = ops[1];
  gameSvc.choosePowers({ code, playerId: opA.id, powers: [POWER_IDS.DOUBLE_POINTS, POWER_IDS.SAFE_MISTAKE, POWER_IDS.UNDO] });
  gameSvc.choosePowers({ code, playerId: opB.id, powers: [POWER_IDS.BLOCK_TURN, POWER_IDS.SPY_VISION, POWER_IDS.LOCK_WORD] });

  const spy = getSpymaster(room);
  gameSvc.giveClue({ code, playerId: spy.id, word: 'x', number: 3 });

  const black = room.board.find(c => c.color === 'assassin');
  gameSvc.guessCard({ code, playerId: opA.id, cardId: black.id });

  assert.equal(room.status, STATUS.GAME_END);
  assert.equal(room.blackHit, true);
  assert.equal(room.gameEndReason, 'black');
  assert.equal(room.gameScores[opB.id], 3, 'opponent +3');

  roomStore.delete(code);
  console.log('  ✓ Black ends game');
}

// Test 5: Block Turn
{
  const { room, code } = setup();
  const ops = getOperatives(room);
  const opA = ops[0], opB = ops[1];
  gameSvc.choosePowers({ code, playerId: opA.id, powers: [POWER_IDS.BLOCK_TURN, POWER_IDS.SAFE_MISTAKE, POWER_IDS.UNDO] });
  gameSvc.choosePowers({ code, playerId: opB.id, powers: [POWER_IDS.DOUBLE_POINTS, POWER_IDS.SPY_VISION, POWER_IDS.LOCK_WORD] });

  const spy = getSpymaster(room);
  gameSvc.giveClue({ code, playerId: spy.id, word: 'x', number: 3 });

  // opA uses Block Turn
  gameSvc.usePower({ code, playerId: opA.id, powerId: POWER_IDS.BLOCK_TURN });

  // new clue → opB excluded
  gameSvc.giveClue({ code, playerId: spy.id, word: 'y', number: 3 });
  assert.equal(room.excludedFromClue.has(opB.id), true, 'opB excluded');

  roomStore.delete(code);
  console.log('  ✓ Block Turn');
}

// Test 6: Max clues end game
{
  const { room, code } = setup();
  const ops = getOperatives(room);
  gameSvc.choosePowers({ code, playerId: ops[0].id, powers: [POWER_IDS.DOUBLE_POINTS, POWER_IDS.SAFE_MISTAKE, POWER_IDS.UNDO] });
  gameSvc.choosePowers({ code, playerId: ops[1].id, powers: [POWER_IDS.BLOCK_TURN, POWER_IDS.SPY_VISION, POWER_IDS.LOCK_WORD] });

  const spy = getSpymaster(room);
  for (let i = 0; i < 10; i++) {
    gameSvc.giveClue({ code, playerId: spy.id, word: `w${i}`, number: 1 });
  }
  assert.equal(room.clueCount, 10);
  assert.throws(
    () => gameSvc.giveClue({ code, playerId: spy.id, word: 'x', number: 1 }),
    /Max clues/
  );

  roomStore.delete(code);
  console.log('  ✓ Max clues');
}

console.log('✅ Powers tests passed');