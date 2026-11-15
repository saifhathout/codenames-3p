const rooms = new Map();

export const roomStore = {
  get: (code) => rooms.get(code),
  set: (code, room) => rooms.set(code, room),
  has: (code) => rooms.has(code),
  delete: (code) => rooms.delete(code),
  list: () => [...rooms.values()],
};