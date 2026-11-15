import { getOperatives } from './roles.js';
import { STATUS } from './constants.js';

export function setInitialTurn(room) {
  room.currentTurn = getOperatives(room)[0].id;
}

export function switchTurn(room) {
  const ops = getOperatives(room);
  room.currentTurn = ops.find(o => o.id !== room.currentTurn).id;
}

export function canGuess(room, playerId) {
  return room.status === STATUS.PLAYING
      && room.currentTurn === playerId
      && room.currentClue !== null;
}