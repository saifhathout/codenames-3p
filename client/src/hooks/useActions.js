import { socket } from '../socket';

export const actions = {
  createRoom: (name, lang) =>
    new Promise(res => socket.emit('room:create', { name, lang }, res)),
  joinRoom: (code, name) =>
    new Promise(res => socket.emit('room:join', { code, name }, res)),
  reconnect: (code, pid) =>
    new Promise(res => socket.emit('room:reconnect', { code, pid }, res)),
  startGame: () =>
    new Promise(res => socket.emit('game:start', {}, res)),
  choosePowers: (powers) =>
    new Promise(res => socket.emit('powers:choose', { powers }, res)),
  giveClue: (word, number) =>
    new Promise(res => socket.emit('clue:give', { word, number }, res)),
  guessCard: (cardId, useDoublePoints = false) =>
    new Promise(res => socket.emit('card:guess', { cardId, useDoublePoints }, res)),
  endTurn: () =>
    new Promise(res => socket.emit('turn:end', {}, res)),
  resolveUndo: (useUndo) =>
    new Promise(res => socket.emit('undo:resolve', { useUndo }, res)),
  usePower: (powerId, payload = {}) =>
    new Promise(res => socket.emit('power:use', { powerId, payload }, res)),
  nextGame: () =>
    new Promise(res => socket.emit('game:next', {}, res)),
};