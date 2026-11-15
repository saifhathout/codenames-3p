import { ROLES } from './constants.js';

export function assignRoles(room) {
  const spyIndex = room.gameNumber % 3;
  room.players.forEach((p, i) => {
    p.role = i === spyIndex ? ROLES.SPYMASTER : ROLES.OPERATIVE;
  });
}

export function getSpymaster(room) {
  return room.players.find(p => p.role === ROLES.SPYMASTER);
}

export function getOperatives(room) {
  return room.players.filter(p => p.role === ROLES.OPERATIVE);
}

export function getOpponent(room, playerId) {
  return getOperatives(room).find(p => p.id !== playerId);
}