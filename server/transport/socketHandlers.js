import { broadcast } from '../application/broadcast.js';
import * as roomSvc from '../application/roomService.js';
import * as gameSvc from '../application/gameService.js';
import { roomStore } from '../store/roomStore.js';
import { publicRoom } from '../domain/views.js';

function bindSocket(room, playerId, socketId) {
  const p = room.players.find(x => x.id === playerId);
  if (p) { p.socketId = socketId; p.connected = true; }
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    const ctx = { code: null, playerId: null };

    const wrap = (fn) => (payload = {}, cb) => {
      try {
        const result = fn(payload);
        if (result?.room) broadcast(io, result.room);
        if (cb) {
          const out = { ok: true };
          if (result?.room) out.state = publicRoom(result.room, ctx.playerId);
          if (result?.code) out.code = result.code;
          if (result?.playerId) out.playerId = result.playerId;
          cb(out);
        }
      } catch (err) {
        console.error('🔴 Handler error:', err);
        if (cb) cb({ ok: false, error: err.message });
      }
    };

    socket.on('room:create', wrap(({ name, lang }) => {
      const { room, playerId } = roomSvc.createRoomFor({ name, lang });
      ctx.code = room.code; ctx.playerId = playerId;
      bindSocket(room, playerId, socket.id);
      socket.join(room.code);
      return { room, code: room.code, playerId };
    }));

    socket.on('room:join', wrap(({ code, name }) => {
      const { room, playerId } = roomSvc.joinRoom({ code, name });
      ctx.code = code; ctx.playerId = playerId;
      bindSocket(room, playerId, socket.id);
      socket.join(code);
      return { room, code, playerId };
    }));

    socket.on('room:reconnect', wrap(({ code, pid }) => {
      const { room, playerId } = roomSvc.reconnect({ code, pid });
      ctx.code = code; ctx.playerId = playerId;
      bindSocket(room, playerId, socket.id);
      socket.join(code);
      return { room, code, playerId };
    }));

    socket.on('game:start', wrap(() => {
      const room = gameSvc.startGame({
        code: ctx.code, hostId: ctx.playerId,
      });
      return { room };
    }));

    socket.on('powers:choose', wrap(({ powers }) => {
      const room = gameSvc.choosePowers({
        code: ctx.code, playerId: ctx.playerId, powers,
      });
      return { room };
    }));

    socket.on('clue:give', wrap(({ word, number }) => {
      const room = gameSvc.giveClue({
        code: ctx.code, playerId: ctx.playerId, word, number,
      });
      return { room };
    }));

    socket.on('card:guess', wrap(({ cardId, useDoublePoints }) => {
      const room = gameSvc.guessCard({
        code: ctx.code, playerId: ctx.playerId, cardId, useDoublePoints,
      });
      return { room };
    }));

    socket.on('turn:end', wrap(() => {
      const room = gameSvc.endTurn({
        code: ctx.code, playerId: ctx.playerId,
      });
      return { room };
    }));

    socket.on('undo:resolve', wrap(({ useUndo }) => {
      const room = gameSvc.resolveUndo({
        code: ctx.code, playerId: ctx.playerId, useUndo,
      });
      return { room };
    }));

    socket.on('power:use', wrap(({ powerId, payload }) => {
      const room = gameSvc.usePower({
        code: ctx.code, playerId: ctx.playerId, powerId, payload,
      });
      return { room };
    }));

    socket.on('game:next', wrap(() => {
      const room = gameSvc.nextGame({
        code: ctx.code, hostId: ctx.playerId,
      });
      return { room };
    }));

    socket.on('disconnect', () => {
      const room = roomStore.get(ctx.code);
      if (!room) return;
      const p = room.players.find(x => x.id === ctx.playerId);
      if (p) { p.connected = false; p.socketId = null; broadcast(io, room); }
    });
  });
}