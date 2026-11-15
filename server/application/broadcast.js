import { publicRoom } from '../domain/views.js';

export function broadcast(io, room) {
  room.players.forEach(p => {
    if (p.socketId) {
      io.to(p.socketId).emit('room:update', publicRoom(room, p.id));
    }
  });
}