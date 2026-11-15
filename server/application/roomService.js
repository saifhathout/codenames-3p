import crypto from 'crypto';
import { createRoom, addPlayer } from '../domain/room.js';
import { roomStore } from '../store/roomStore.js';

function genCode() {
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    if (!roomStore.has(code)) return code;
  }
  throw new Error('Could not generate room code');
}

export function createRoomFor({ name, lang }) {
  if (!name?.trim()) throw new Error('Name required');
  const playerId = crypto.randomUUID();
  const code = genCode();
  const room = createRoom({
    hostId: playerId, hostName: name.trim(), lang, code,
  });
  roomStore.set(code, room);
  return { room, playerId };
}

export function joinRoom({ code, name }) {
  if (!name?.trim()) throw new Error('Name required');
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  if (room.players.length >= 3) throw new Error('Room full');
  if (room.status !== 'lobby') throw new Error('Game already started');
  const playerId = crypto.randomUUID();
  addPlayer(room, { id: playerId, name: name.trim() });
  return { room, playerId };
}

export function reconnect({ code, pid }) {
  const room = roomStore.get(code);
  if (!room) throw new Error('Room not found');
  const player = room.players.find(p => p.id === pid);
  if (!player) throw new Error('Player not found');
  player.connected = true;
  return { room, playerId: pid };
}